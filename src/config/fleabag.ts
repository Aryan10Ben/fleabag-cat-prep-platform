export const fleabagMessages = [
  "Hey, Fleabag. You're one question closer.",
  "Hey, Fleabag. It will pass.",
  "Hey, Fleabag. This feeling will pass.",
  "Hey, Fleabag. Keep going.",
  "Hey, Fleabag. Progress was made today.",
  "Hey, Fleabag. One more step forward.",
  "Hey, Fleabag. You're still in the game.",
  "Hey, Fleabag. You're one section closer.",
  "Hey, Fleabag. The work is adding up.",
  "Hey, Fleabag. Trust the process.",
  "Hey, Fleabag. Keep showing up."
];

export const fleabagReflections = [
  {
    primary: "Hey, Fleabag. It will pass.",
    secondary: "Your score is a snapshot, not your story."
  },
  {
    primary: "Hey, Fleabag. Tomorrow is another attempt.",
    secondary: "Learn what you can from today and rest."
  },
  {
    primary: "Hey, Fleabag. Keep the lesson. Leave the panic.",
    secondary: "Stress will not buy you a higher percentile."
  },
  {
    primary: "Hey, Fleabag. Growth rarely feels dramatic.",
    secondary: "It feels like a slow, boring climb. You're doing fine."
  },
  {
    primary: "Hey, Fleabag. Review. Learn. Move forward.",
    secondary: "Mistakes are just data points for correction."
  }
];

export function getRandomMessage(): string {
  const index = Math.floor(Math.random() * fleabagMessages.length);
  return fleabagMessages[index];
}

export function getRandomReflection(): { primary: string; secondary: string } {
  const index = Math.floor(Math.random() * fleabagReflections.length);
  return fleabagReflections[index];
}
