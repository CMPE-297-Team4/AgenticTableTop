# Fantasy UI Components Quick Reference

## Quick Start

All fantasy-enhanced components are ready to use. Import them like regular components:

```tsx
import { FantasyButton } from '@/components/FantasyButton';
import { FantasyCard } from '@/components/FantasyCard';
import { FantasyProgressBar } from '@/components/FantasyProgressBar';
import { InventoryPanel } from '@/components/InventoryPanel';
import { playSound } from '@/utils/soundEffects';
```

---

## FantasyButton

Enhanced button with medieval styling and sound effects.

### Basic Usage
```tsx
<FantasyButton>Click Me</FantasyButton>
```

### Variants
```tsx
<FantasyButton variant="default">Default</FantasyButton>
<FantasyButton variant="accent">Accent</FantasyButton>
<FantasyButton variant="destructive">Delete</FantasyButton>
<FantasyButton variant="outline">Outline</FantasyButton>
<FantasyButton variant="ghost">Ghost</FantasyButton>
<FantasyButton variant="rune">⚜ With Runes ⚜</FantasyButton>
```

### With Sound Effects
```tsx
<FantasyButton 
  playSoundOnHover
  playSoundOnClick
>
  Interactive Button
</FantasyButton>
```

### Sizes
```tsx
<FantasyButton size="sm">Small</FantasyButton>
<FantasyButton size="default">Default</FantasyButton>
<FantasyButton size="lg">Large</FantasyButton>
<FantasyButton size="icon">🔮</FantasyButton>
```

---

## FantasyCard

Enhanced card with parchment textures and medieval borders.

### Basic Usage
```tsx
<FantasyCard>
  <FantasyCardContent>Content</FantasyCardContent>
</FantasyCard>
```

### Variants
```tsx
<FantasyCard variant="default">Default card</FantasyCard>
<FantasyCard variant="parchment">Parchment texture</FantasyCard>
<FantasyCard variant="scroll">Scroll-style border</FantasyCard>
<FantasyCard variant="quest">Quest card with left border</FantasyCard>
<FantasyCard variant="inventory">Inventory panel style</FantasyCard>
```

### With Runes
```tsx
<FantasyCard variant="parchment" withRunes>
  Card with rune decorations
</FantasyCard>
```

### Animated
```tsx
<FantasyCard variant="scroll" animated>
  Card with scroll unfurl animation
</FantasyCard>
```

### Full Example
```tsx
<FantasyCard variant="quest" withRunes>
  <FantasyCardHeader>
    <FantasyCardTitle className="text-glow-primary">
      Quest: The Ancient Scroll
    </FantasyCardTitle>
    <FantasyCardDescription className="font-fantasy-body">
      A mysterious quest awaits...
    </FantasyCardDescription>
  </FantasyCardHeader>
  <FantasyCardContent>
    <p className="font-fantasy-body">
      Your journey begins in the ancient library...
    </p>
  </FantasyCardContent>
  <FantasyCardFooter>
    <FantasyButton>Accept Quest</FantasyButton>
  </FantasyCardFooter>
</FantasyCard>
```

---

## FantasyProgressBar

RPG-style progress bars for HP, Mana, XP.

### Basic Usage
```tsx
<FantasyProgressBar
  current={75}
  max={100}
  variant="hp"
  label="Health Points"
  showNumbers
  showIcon
/>
```

### Variants
```tsx
<FantasyProgressBar variant="hp" current={50} max={100} />
<FantasyProgressBar variant="mana" current={30} max={50} />
<FantasyProgressBar variant="xp" current={250} max={500} />
```

### Options
- `label`: Custom label text
- `showNumbers`: Show current/max values
- `showIcon`: Show variant icon (heart, zap, star)
- `className`: Additional CSS classes

---

## InventoryPanel

RPG inventory-style panel for organizing items.

### Basic Usage
```tsx
<InventoryPanel
  categories={[
    {
      name: "Weapons",
      items: [
        {
          id: "1",
          name: "Sword of Truth",
          icon: "⚔️",
          rarity: "legendary",
          description: "A legendary blade",
        },
      ],
    },
  ]}
  onItemClick={(item) => console.log('Clicked:', item)}
/>
```

### Item Rarities
- `common` - Gray
- `uncommon` - Green
- `rare` - Blue
- `epic` - Purple
- `legendary` - Gold/Yellow

---

## Sound Effects

Play sound effects for game actions.

### Available Sounds
```tsx
playSound('dice-roll');
playSound('dice-roll-success');
playSound('dice-roll-critical');
playSound('spell-cast');
playSound('spell-success');
playSound('combat-hit');
playSound('combat-miss');
playSound('combat-critical');
playSound('level-up');
playSound('quest-complete');
playSound('item-pickup');
playSound('button-hover');
playSound('button-click');
playSound('notification');
playSound('error');
```

### With Custom Volume
```tsx
playSound('dice-roll', { volume: 0.7 });
```

### Sound Configuration
```tsx
import { setSoundEnabled, setSoundVolume, getSoundConfig } from '@/utils/soundEffects';

// Disable sounds
setSoundEnabled(false);

// Set volume (0.0 to 1.0)
setSoundVolume(0.5);

// Get current config
const config = getSoundConfig();
console.log(config); // { enabled: true, volume: 0.5 }
```

---

## Typography Classes

### Font Classes
```tsx
<h1 className="font-fantasy-title">Main Title</h1>
<h2 className="font-fantasy-heading">Section Heading</h2>
<p className="font-fantasy-body">Body text with story-like feel</p>
<span className="font-fantasy-script">Decorative script text</span>
<span className="font-fantasy-runes">Runic text</span>
```

### Text Effects
```tsx
<h1 className="text-mystical">Mystical glowing text</h1>
<h2 className="text-glow-primary">Primary glow</h2>
<h2 className="text-glow-accent">Accent glow</h2>
```

---

## CSS Utility Classes

### Backgrounds
```tsx
<div className="parchment-bg">Parchment texture background</div>
<div className="fantasy-bg">Fantasy gradient background</div>
```

### Borders
```tsx
<div className="border-medieval">Medieval border</div>
<div className="border-scroll">Scroll-style border</div>
```

### Effects
```tsx
<div className="rune-border">Rune decorations</div>
<div className="spark-container">
  <div className="spark" />
</div>
<div className="aura-glow">Magical aura</div>
```

### Animations
```tsx
<div className="scroll-unfurl">Scroll animation</div>
<div className="magical-glow">Glowing effect</div>
```

---

## Complete Example

```tsx
import { FantasyButton } from '@/components/FantasyButton';
import { FantasyCard } from '@/components/FantasyCard';
import { FantasyProgressBar } from '@/components/FantasyProgressBar';
import { playSound } from '@/utils/soundEffects';

function CharacterSheet() {
  const handleDiceRoll = () => {
    playSound('dice-roll');
    // Roll dice logic...
  };

  return (
    <FantasyCard variant="parchment" withRunes>
      <FantasyCardHeader>
        <FantasyCardTitle className="font-fantasy-title text-mystical">
          Character Name
        </FantasyCardTitle>
      </FantasyCardHeader>
      <FantasyCardContent className="space-y-4">
        <FantasyProgressBar
          current={75}
          max={100}
          variant="hp"
          label="Health"
          showNumbers
          showIcon
        />
        <FantasyButton
          variant="rune"
          onClick={handleDiceRoll}
          playSoundOnClick
        >
          ⚜ Roll Dice ⚜
        </FantasyButton>
      </FantasyCardContent>
    </FantasyCard>
  );
}
```

---

## Tips & Best Practices

1. **Use Fantasy Typography**: Apply fantasy font classes to titles and important text
2. **Add Sound Effects**: Use sound effects sparingly for important actions
3. **Choose Appropriate Variants**: Use `quest` variant for quests, `parchment` for documents
4. **Rune Decorations**: Use `withRunes` for important cards/panels
5. **Progress Bars**: Use appropriate variants (hp/mana/xp) for different stats
6. **Accessibility**: All components respect `prefers-reduced-motion`

---

## Migration from Standard Components

### Buttons
```tsx
// Before
<Button>Click</Button>

// After
<FantasyButton>Click</FantasyButton>
```

### Cards
```tsx
// Before
<Card>
  <CardContent>Content</CardContent>
</Card>

// After
<FantasyCard variant="parchment">
  <FantasyCardContent>Content</FantasyCardContent>
</FantasyCard>
```

### Progress Bars
```tsx
// Before
<div className="w-full bg-gray-200">
  <div className="bg-blue-500 h-2" style={{ width: '75%' }} />
</div>

// After
<FantasyProgressBar current={75} max={100} variant="hp" />
```

