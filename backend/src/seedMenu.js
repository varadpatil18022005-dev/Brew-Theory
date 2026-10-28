const MenuItem = require('./models/MenuItem');

const menu = [
  { name: 'House Cappuccino', category: 'Coffee', description: 'Double espresso, silky milk and a soft dusting of cocoa.', price: 180, icon: 'coffee' },
  { name: 'Velvet Latte', category: 'Coffee', description: 'Our signature espresso with warm, smooth steamed milk.', price: 195, icon: 'cup' },
  { name: 'Maple Flat White', category: 'Coffee', description: 'A short, rich flat white with a touch of maple sweetness.', price: 210, icon: 'coffee' },
  { name: 'Pour-over of the Day', category: 'Coffee', description: 'Slow-brewed single origin, served black or with milk.', price: 220, icon: 'filter' },
  { name: 'Brown Sugar Cold Brew', category: 'Cold drinks', description: 'Eighteen-hour steep, brown sugar and a splash of cream.', price: 230, icon: 'cold' },
  { name: 'Iced Mocha', category: 'Cold drinks', description: 'Chilled espresso, dark chocolate and cold milk.', price: 240, icon: 'cold' },
  { name: 'Citrus Iced Tea', category: 'Cold drinks', description: 'House-brewed tea, fresh citrus and a hint of mint.', price: 165, icon: 'tea' },
  { name: 'Butter Croissant', category: 'Bakery', description: 'Flaky, golden layers baked fresh every morning.', price: 145, icon: 'bakery' },
  { name: 'Cardamom Bun', category: 'Bakery', description: 'Soft twisted bun with cardamom sugar and pearl sugar.', price: 165, icon: 'bakery' },
  { name: 'Chocolate Fudge Slice', category: 'Bakery', description: 'Deep cocoa, a tender crumb and a little sea salt.', price: 195, icon: 'cake' },
  { name: 'Avocado Toast', category: 'Brunch', description: 'Sourdough, smashed avocado, lemon and chili flakes.', price: 310, icon: 'brunch' },
  { name: 'Cafe Breakfast Plate', category: 'Brunch', description: 'Soft eggs, toast, greens and our house tomato relish.', price: 360, icon: 'brunch' },
];

async function seedMenu() {
  if (await MenuItem.estimatedDocumentCount()) return;
  await MenuItem.insertMany(menu);
  console.log(`Added ${menu.length} starter menu items.`);
}

module.exports = seedMenu;
