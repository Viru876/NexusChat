import { useEffect, useRef } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Wraps the emoji-mart picker with dark theming and outside-click handling.
 */
export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay so the opening click doesn't immediately close it.
    const t = setTimeout(() => document.addEventListener('mousedown', onClick), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  return (
    <div ref={ref} className="z-50">
      <Picker
        data={data}
        theme="dark"
        previewPosition="none"
        skinTonePosition="none"
        onEmojiSelect={(emoji: { native: string }) => {
          onSelect(emoji.native);
        }}
      />
    </div>
  );
}
