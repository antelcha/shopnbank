// Harmonious color palettes
const colorPalettes = [
  // Cool Blues & Purples
  ['#667eea', '#764ba2', '#f093fb', '#667eea'],
  ['#4facfe', '#00f2fe', '#43e97b', '#38f9d7'],
  ['#667eea', '#764ba2', '#f093fb', '#667eea'],
  
  // Warm Sunset
  ['#fa709a', '#fee140', '#ff9a9e', '#fecfef'],
  ['#ffecd2', '#fcb69f', '#ff8a80', '#ff9a9e'],
  ['#f8cdda', '#1e3c72', '#74b9ff', '#0984e3'],
  
  // Purple & Pink
  ['#a8edea', '#fed6e3', '#f093fb', '#f5576c'],
  ['#ff9a9e', '#fecfef', '#ffeaa7', '#fab1a0'],
  ['#fd79a8', '#fdcb6e', '#6c5ce7', '#74b9ff'],
  
  // Green & Teal
  ['#56ab2f', '#a8e6cf', '#00b894', '#00cec9'],
  ['#134e5e', '#71b280', '#42e695', '#3bb78f'],
  ['#11998e', '#38ef7d', '#7bed9f', '#70a1ff'],
  
  // Cosmic
  ['#8e2de2', '#4a00e0', '#667eea', '#764ba2'],
  ['#fc466b', '#3f5efb', '#667eea', '#764ba2'],
  ['#fdbb2d', '#22c1c3', '#13547a', '#80d0c7']
]

// Select harmonious colors from same palette
const generateHarmoniousColors = (): { color1: string, color2: string, color3?: string } => {
  const palette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)]
  const shuffled = [...palette].sort(() => Math.random() - 0.5)
  
  return {
    color1: shuffled[0],
    color2: shuffled[1],
    color3: Math.random() > 0.6 ? shuffled[2] : undefined // 40% chance for 3rd color
  }
}

// Random direction for linear gradients
const generateRandomDirection = (): string => {
  const directions = [
    'to right', 'to left', 'to top', 'to bottom',
    'to top right', 'to top left', 'to bottom right', 'to bottom left',
    '45deg', '90deg', '135deg', '180deg', '225deg', '270deg', '315deg'
  ]
  
  return directions[Math.floor(Math.random() * directions.length)]
}

// Random position for radial gradients
const generateRandomPosition = (): string => {
  const positions = [
    'center', 'top', 'bottom', 'left', 'right',
    'top left', 'top right', 'bottom left', 'bottom right',
    'center top', 'center bottom'
  ]
  
  return positions[Math.floor(Math.random() * positions.length)]
}

// Generate linear gradient with harmonious colors (left to right)
export const generateRandomGradient = (): string => {
  const { color1, color2, color3 } = generateHarmoniousColors()
  const direction = "to right"
  
  if (color3) {
    return `linear-gradient(${direction}, ${color1}, ${color2}, ${color3})`
  }
  return `linear-gradient(${direction}, ${color1}, ${color2})`
}

// Generate multiple gradients for different cards
export const generateGradients = (count: number): string[] => {
  return Array.from({ length: count }, () => generateRandomGradient())
}

// Preset gradient themes
export const gradientThemes = {
  ocean: [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'radial-gradient(circle at center, #4facfe 0%, #00f2fe 100%)'
  ],
  sunset: [
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #f8cdda 0%, #1e3c72 100%)',
    'radial-gradient(circle at top right, #ff9a9e 0%, #fecfef 100%)'
  ],
  space: [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'radial-gradient(circle at center, #2d1b69 0%, #11998e 100%)',
    'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)'
  ]
}