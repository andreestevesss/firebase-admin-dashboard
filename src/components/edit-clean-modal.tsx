'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckIn } from '@/lib/data-service';
import { Car, Calendar, MapPin, User, Camera, RotateCw, Wand2, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface EditCleanModalProps {
  clean: CheckIn | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clean: CheckIn) => void;
  branches: string[];
  type?: 'daily-clean' | 'sales-prep';
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  isNavigating?: boolean;
}

declare global {
  interface Window {
    Tesseract: any;
  }
}

export function EditCleanModal({
  clean,
  isOpen,
  onClose,
  onSave,
  branches,
  type = 'daily-clean',
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
  isNavigating = false
}: EditCleanModalProps) {
  const [formData, setFormData] = useState<Partial<CheckIn>>({
    branch: '',
    insurance: '',
    make: '',
    model: '',
    year: '',
    stock: '',
    vin: '',
    userId: '',
    userFullName: '',
    picture: '',
    status: '',
    rotation: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [didAutoFix, setDidAutoFix] = useState(false);
  const [navDirection, setNavDirection] = useState<'next' | 'prev' | null>(null);

  // Reset form when clean changes
  useEffect(() => {
    if (clean) {
      const newFormData = {
        branch: clean.branch || '',
        insurance: clean.insurance || '',
        make: clean.make || '',
        model: clean.model || '',
        year: clean.year || '',
        stock: clean.stock || '',
        vin: clean.vin || '',
        userId: clean.userId || '',
        userFullName: clean.userFullName || '',
        picture: clean.picture || '',
        status: clean.status || 'completed',
        rotation: clean.rotation || 0
      };

      setFormData(newFormData);
      setHasChanges(false);
      setDidAutoFix(false);
      setNavDirection(null);
    }
  }, [clean]);

  // Dedicated Auto-Fix Trigger
  useEffect(() => {
    if (isOpen && formData.picture && formData.picture !== 'N/A' && !didAutoFix && !isDetecting) {
      // Small Delay before auto-triggering
      const timer = setTimeout(() => {
        console.log('Auto-triggering Smart Fix...');
        setDidAutoFix(true);
        handleSmartFix();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, formData.picture, didAutoFix, isDetecting]);

  const handleInputChange = (field: keyof CheckIn, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleRotate = () => {
    const nextRotation = ((formData.rotation || 0) + 90) % 360;
    handleInputChange('rotation', nextRotation);
  };

  const handleSmartFix = async () => {
    if (!formData.picture || formData.picture === 'N/A') return;

    setIsDetecting(true);
    try {
      // Load Tesseract if not present
      if (!window.Tesseract) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const img = new Image();
      img.crossOrigin = "Anonymous";
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = formData.picture!;
      });

      const worker = await window.Tesseract.createWorker('eng');

      // We will try 4 rotations and check which one contains numbers (Stock #)
      // Since we already have the stock #, we can check for it specifically!
      const targetStock = formData.stock?.trim();
      let bestRotation = formData.rotation || 0;
      let highestScore = -1;

      // Create a canvas once
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // We test ALL 4 rotations and score them
      for (const rot of [0, 90, 180, 270]) {
        const isLandscape = rot === 90 || rot === 270;

        // Swap dimensions for 90/270
        if (isLandscape) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.restore();

        // Run OCR with a slight quality boost
        // Run OCR with word-level data for coordinate analysis
        const { data } = await worker.recognize(canvas.toDataURL('image/jpeg', 0.95));
        const { text, confidence, words } = data;

        const cleanText = text.replace(/[^a-zA-Z0-9]/g, '');
        const cleanStock = (targetStock || '').replace(/[^a-zA-Z0-9]/g, '').trim();

        // --- ADVANCED SCORING SYSTEM ---
        let currentScore = confidence;

        // HOME ROTATION BONUS: Overwhelming preference for the original photo
        // Humans usually take photos the right way up. Don't touch it unless it's hopeless.
        if (rot === 0) {
          currentScore += 1500;
        }

        // 1. Precise Stock # Match & Position Analysis
        if (cleanStock && cleanStock.length >= 6) {
          const stockWord = words.find((w: any) => 
            w.text.replace(/[^0-9]/g, '').includes(cleanStock) || 
            cleanStock.includes(w.text.replace(/[^0-9]/g, ''))
          );

          if (stockWord) {
            // Found the stock #! Base bonus
            currentScore += 500;

            // BONUS: Moderate Confidence match?
            if (stockWord.confidence > 60) currentScore += 500;

            // BONUS: Is the Stock # at the TOP of the image? (User Rule: "Stock should be on top")
            const relativeY = stockWord.bbox.y0 / canvas.height;
            if (relativeY < 0.45) {
              currentScore += 1000 * (1 - relativeY);
            }

            // SHORT-CIRCUIT: If rotation 0 finds the stock # even reasonably well, STOP.
            // We trust the human's original orientation more than the AI's desire to "read" better sideways.
            if (rot === 0 && stockWord.confidence > 60) {
              console.log("Short-circuit: 0° is good enough. Staying at home.");
              bestRotation = 0;
              highestScore = currentScore + 99999;
              break;
            }
          } else if (cleanText.includes(cleanStock)) {
            currentScore += 400;
          }
        }

        // 2. Orientation Heuristics
        // Bonus: Horizontal (Landscape) is MUCH better than Vertical (Portrait) for these photos
        if (canvas.width > canvas.height) currentScore += 1500;
;

        // 3. Digit Density (favors rotations where numbers are readable)
        const digitMatch = cleanText.match(/\d{6,}/);
        if (digitMatch) currentScore += (digitMatch[0].length * 10);

        console.log(`Rotation ${rot}° | Score: ${currentScore} | Text: ${cleanText.substring(0, 20)}...`);

        if (currentScore > highestScore) {
          highestScore = currentScore;
          bestRotation = rot;
        }
      }

      // INSTANT OFF: Turn off the scanner as soon as we have the result
      setIsDetecting(false);

      await worker.terminate();
      console.log(`Smart Fix selected ${bestRotation}° as the best orientation.`);

      // Only mark changes if the rotation actually CHANGED
      if (bestRotation !== formData.rotation) {
        handleInputChange('rotation', bestRotation);
      }

    } catch (error) {
      console.error('Error during Smart Fix:', error);
      setIsDetecting(false);
      alert('Failed to auto-detect orientation. Please rotate manually.');
    }
  };

  const handleSave = async () => {
    if (!clean) return;

    // Basic validation
    if (!formData.make?.trim()) {
      alert('Vehicle make is required');
      return;
    }
    if (!formData.model?.trim()) {
      alert('Vehicle model is required');
      return;
    }

    setIsSaving(true);
    try {
      // Update the document in Firestore without changing timestamp
      const collectionName = type === 'daily-clean' ? 'ScannedCheckIN' : 'SalesPrep';
      const cleanRef = doc(db, collectionName, clean.id);

      // Prepare update data - exclude timestamp to preserve original
      const updateData = {
        make: formData.make || clean.make,
        model: formData.model || clean.model,
        year: formData.year || clean.year,
        stock: formData.stock || clean.stock,
        vin: formData.vin || clean.vin,
        insurance: formData.insurance || clean.insurance,
        branch: formData.branch || clean.branch,
        rotation: formData.rotation !== undefined ? formData.rotation : (clean.rotation || 0),
        // Note: NOT updating timestamp - preserve original
      };

      console.log('Saving to database with data:', updateData);

      // Update the document
      await updateDoc(cleanRef, updateData);

      // Create updated clean object for callback
      const updatedClean: CheckIn = {
        ...clean,
        ...updateData,
        timestamp: clean.timestamp // Preserve original timestamp
      };

      console.log('Document updated successfully');
      await onSave(updatedClean);
      onClose();
    } catch (error) {
      console.error('Error updating document:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges && !isSaving) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else if (!isSaving) {
      onClose();
    }
  };

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (isNavigating) return;
    
    setNavDirection(direction);

    if (hasChanges && !isSaving) {
      if (!confirm('You have unsaved changes. Discard changes and move to the next record?')) {
        return;
      }
    }

    if (direction === 'next' && onNext) {
      onNext();
    } else if (direction === 'prev' && onPrevious) {
      onPrevious();
    }
  };

  if (!clean) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[960px] bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#262626] shadow-xl">
        <DialogHeader className="border-b border-gray-200 dark:border-[#262626] pb-4 bg-gray-50 dark:bg-[#262626] -mx-6 px-6 py-4 -mt-6">
          <div className="flex items-center justify-between w-full pr-8">
            <div className="flex flex-col">
              <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-[#fafafa] flex items-center gap-2">
                <Car className="w-4 h-4" />
                Edit {type === 'daily-clean' ? 'Vehicle Clean' : 'Sales Prep'} Record
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-600 dark:text-[#a1a1a1]">
                Update vehicle information and clean details
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={!hasPrevious || isSaving || isNavigating}
                onClick={() => handleNavigate('prev')}
                className="group h-8 text-xs text-gray-600 dark:text-[#a1a1a1] hover:text-gray-900 dark:hover:text-[#fafafa]"
              >
                {isNavigating && navDirection === 'prev' ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-2" />
                ) : (
                  <ArrowLeft
                    className="-ms-1 me-2 opacity-60 transition-transform group-hover:-translate-x-0.5"
                    size={14}
                    strokeWidth={2}
                  />
                )}
                Previously
              </Button>
              <div className="w-[1px] h-4 bg-gray-200 dark:bg-[#404040]" />
              <Button
                variant="ghost"
                size="sm"
                disabled={!hasNext || isSaving || isNavigating}
                onClick={() => handleNavigate('next')}
                className="group h-8 text-xs text-gray-600 dark:text-[#a1a1a1] hover:text-gray-900 dark:hover:text-[#fafafa]"
              >
                Next
                {isNavigating && navDirection === 'next' ? (
                  <Loader2 className="w-3 h-3 animate-spin ml-2" />
                ) : (
                  <ArrowRight
                    className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
                    size={14}
                    strokeWidth={2}
                  />
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          <div className="flex flex-row gap-6">
            {/* Left Side - Picture Only */}
            <div className="flex-shrink-0">
              <div className="border border-gray-200 dark:border-[#262626] rounded-lg p-2 bg-white dark:bg-[#262626] shadow-sm relative group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-gray-500 dark:text-[#a1a1a1]" />
                    <Label className="text-sm font-medium text-gray-700 dark:text-[#a1a1a1]">Vehicle Photo</Label>
                    {isDetecting && (
                      <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1">
                        ✨ AI Analyzing...
                      </span>
                    )}
                  </div>

                  {/* Rotation Controls */}
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRotate}
                      className="h-7 px-2 border-gray-200 dark:border-[#404040] text-xs gap-1"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSmartFix}
                      disabled={isDetecting}
                      className="h-7 px-2 border-gray-200 dark:border-[#404040] text-xs gap-1 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                      title="Auto-Detect Orientation (AI)"
                    >
                      {isDetecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      Magic Fix
                    </Button>
                  </div>
                </div>

                <div className="relative w-[600px] h-[400px] flex items-center justify-center bg-gray-50 dark:bg-[#1a1a1a] rounded overflow-hidden border border-gray-100 dark:border-[#262626]">
                  {/* Subtle AI Scanner Line - Synchronized with isDetecting */}
                  {isDetecting && (
                    <motion.div
                      initial={{ top: '0%' }}
                      animate={{ top: '100%' }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 2.5, 
                        ease: "linear"
                      }}
                      className="absolute left-0 right-0 h-[1px] bg-blue-400/40 shadow-[0_0_8px_rgba(96,165,250,0.3)] z-20 pointer-events-none"
                    />
                  )}

                  {formData.picture && formData.picture !== 'N/A' ? (
                    <img
                      src={formData.picture}
                      alt="Vehicle clean picture"
                      className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-90 transition-all duration-300"
                      style={{ transform: `rotate(${formData.rotation || 0}deg)` }}
                      onClick={() => window.open(formData.picture, '_blank')}
                      title="Click to open full size"
                    />
                  ) : (
                    <div className="text-center text-gray-500 dark:text-[#a1a1a1]">
                      <Camera className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">No photo available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Form Fields - Compact Layout */}
            <div className="flex-1">
              <div className="space-y-3">
                {/* Form Fields - Compact Single Column */}
                <div className="space-y-3 w-[280px]">
                  {/* STOCK */}
                  <div className="space-y-1">
                    <Label htmlFor="stock" className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Stock #</Label>
                    <Input
                      id="stock"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      className="border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#262626] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm h-8"
                      placeholder="Stock number"
                    />
                  </div>

                  {/* INSURANCE */}
                  <div className="space-y-1">
                    <Label htmlFor="insurance" className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Insurance #</Label>
                    <Input
                      id="insurance"
                      value={formData.insurance}
                      onChange={(e) => handleInputChange('insurance', e.target.value)}
                      className="border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#262626] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm h-8"
                      placeholder="Insurance number"
                    />
                  </div>

                  {/* MAKE */}
                  <div className="space-y-1">
                    <Label htmlFor="make" className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Make</Label>
                    <Input
                      id="make"
                      value={formData.make}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      className="border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#262626] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm h-8"
                      placeholder="Vehicle make"
                    />
                  </div>

                  {/* MODEL */}
                  <div className="space-y-1">
                    <Label htmlFor="model" className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#262626] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm h-8"
                      placeholder="Vehicle model"
                    />
                  </div>

                  {/* YEAR */}
                  <div className="space-y-1">
                    <Label htmlFor="year" className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">Year</Label>
                    <Input
                      id="year"
                      value={formData.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#262626] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm h-8"
                      placeholder="Vehicle year"
                    />
                  </div>

                  {/* VIN */}
                  <div className="space-y-1">
                    <Label htmlFor="vin" className="text-xs font-medium text-gray-700 dark:text-[#a1a1a1]">VIN</Label>
                    <Input
                      id="vin"
                      value={formData.vin}
                      onChange={(e) => handleInputChange('vin', e.target.value)}
                      className="border border-gray-300 dark:border-[#262626] bg-white dark:bg-[#262626] focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm h-8"
                      placeholder="Vehicle Identification Number"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-gray-200 dark:border-[#262626] pt-4 bg-gray-50 dark:bg-[#262626] -mx-6 px-6 -mb-6 pb-4">
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-gray-500 dark:text-[#a1a1a1]">
              {hasChanges && <span className="text-orange-600 dark:text-orange-400">• You have unsaved changes</span>}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSaving}
                className="border-gray-300 dark:border-[#525252] bg-white dark:bg-[#262626] text-gray-700 dark:text-[#fafafa] hover:bg-gray-50 dark:hover:bg-[#404040]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
