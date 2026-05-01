/**
 * Demo Catalog Seed
 *
 * Seeds ~50 well-known spirits with real barcodes directly into the database.
 * No external data files required — suitable for Phase 1 board demo.
 *
 * Run: pnpm --filter workers seed:demo-catalog
 */

import { prisma } from '@pour/db';

const DISTILLERIES = [
  { name: 'Buffalo Trace Distillery', slug: 'buffalo-trace-distillery', region: 'Kentucky', country: 'US' },
  { name: 'Brown-Forman', slug: 'brown-forman', region: 'Kentucky', country: 'US' },
  { name: 'Beam Suntory', slug: 'beam-suntory', region: 'Kentucky', country: 'US' },
  { name: 'Heaven Hill', slug: 'heaven-hill', region: 'Kentucky', country: 'US' },
  { name: 'Wild Turkey Distillery', slug: 'wild-turkey-distillery', region: 'Kentucky', country: 'US' },
  { name: 'William Grant & Sons', slug: 'william-grant-sons', region: 'Scotland', country: 'GB' },
  { name: 'The Macallan', slug: 'the-macallan', region: 'Speyside', country: 'GB' },
  { name: 'Laphroaig Distillery', slug: 'laphroaig-distillery', region: 'Islay', country: 'GB' },
  { name: 'Irish Distillers', slug: 'irish-distillers', region: 'Cork', country: 'IE' },
  { name: 'Patrón Spirits', slug: 'patron-spirits', region: 'Jalisco', country: 'MX' },
  { name: 'Jose Cuervo', slug: 'jose-cuervo', region: 'Jalisco', country: 'MX' },
  { name: 'Bacardi Limited', slug: 'bacardi-limited', region: 'San Juan', country: 'PR' },
  { name: 'Diageo', slug: 'diageo', region: 'London', country: 'GB' },
  { name: 'Pernod Ricard', slug: 'pernod-ricard', region: 'Paris', country: 'FR' },
  { name: 'Tito\'s Handmade Vodka', slug: 'titos-handmade-vodka', region: 'Texas', country: 'US' },
];

const SPIRITS: Array<{
  name: string;
  slug: string;
  distillery: string;
  category: string;
  subcategory?: string;
  abv: number;
  description: string;
  barcodes: string[];
  flavorSweet?: number;
  flavorSmoke?: number;
  flavorFruit?: number;
  flavorGrain?: number;
  flavorSpice?: number;
  flavorFloral?: number;
  flavorBody?: number;
}> = [
  // American Bourbon
  {
    name: "Maker's Mark",
    slug: 'makers-mark',
    distillery: 'beam-suntory',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 45,
    description: 'A soft, full-flavored Kentucky straight bourbon with notes of vanilla, caramel, and a hint of fruit.',
    barcodes: ['087000082200'],
    flavorSweet: 0.75, flavorSmoke: 0.1, flavorFruit: 0.55, flavorGrain: 0.6, flavorSpice: 0.35, flavorFloral: 0.3, flavorBody: 0.6,
  },
  {
    name: 'Buffalo Trace',
    slug: 'buffalo-trace',
    distillery: 'buffalo-trace-distillery',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 45,
    description: 'Complex, with hints of vanilla, toffee, and candied fruit. Smooth finish with notes of oak and spice.',
    barcodes: ['088004000051'],
    flavorSweet: 0.7, flavorSmoke: 0.1, flavorFruit: 0.5, flavorGrain: 0.65, flavorSpice: 0.4, flavorFloral: 0.2, flavorBody: 0.65,
  },
  {
    name: 'Bulleit Bourbon',
    slug: 'bulleit-bourbon',
    distillery: 'diageo',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 45,
    description: 'High rye content gives bold, spicy character with hints of vanilla, honey, and dried fruit.',
    barcodes: ['086081000059'],
    flavorSweet: 0.55, flavorSmoke: 0.1, flavorFruit: 0.45, flavorGrain: 0.65, flavorSpice: 0.7, flavorFloral: 0.15, flavorBody: 0.6,
  },
  {
    name: 'Woodford Reserve',
    slug: 'woodford-reserve',
    distillery: 'brown-forman',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 45.2,
    description: 'Rich, full-bodied with over 200 detectable flavor notes including dried fruit, vanilla, tobacco, and spice.',
    barcodes: ['096749087034'],
    flavorSweet: 0.65, flavorSmoke: 0.15, flavorFruit: 0.6, flavorGrain: 0.6, flavorSpice: 0.55, flavorFloral: 0.25, flavorBody: 0.75,
  },
  {
    name: "Jack Daniel's Old No. 7",
    slug: 'jack-daniels-old-no-7',
    distillery: 'brown-forman',
    category: 'Whiskey',
    subcategory: 'Tennessee Whiskey',
    abv: 40,
    description: 'Charcoal mellowed through 10 feet of sugar maple charcoal. Smooth with notes of caramel and vanilla.',
    barcodes: ['082184090019'],
    flavorSweet: 0.65, flavorSmoke: 0.25, flavorFruit: 0.4, flavorGrain: 0.6, flavorSpice: 0.3, flavorFloral: 0.15, flavorBody: 0.55,
  },
  {
    name: 'Knob Creek Small Batch',
    slug: 'knob-creek-small-batch',
    distillery: 'beam-suntory',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 50,
    description: 'Aged nine years with a full, rich taste — caramel, vanilla, and oak with a long finish.',
    barcodes: ['083783000025'],
    flavorSweet: 0.6, flavorSmoke: 0.1, flavorFruit: 0.4, flavorGrain: 0.7, flavorSpice: 0.55, flavorFloral: 0.15, flavorBody: 0.8,
  },
  {
    name: 'Four Roses Single Barrel',
    slug: 'four-roses-single-barrel',
    distillery: 'beam-suntory',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 50,
    description: 'Bold, full-bodied with subtle hints of ripe plum, caramel, and light spice.',
    barcodes: ['081128000058'],
    flavorSweet: 0.6, flavorSmoke: 0.1, flavorFruit: 0.65, flavorGrain: 0.55, flavorSpice: 0.45, flavorFloral: 0.2, flavorBody: 0.7,
  },
  {
    name: 'Wild Turkey 101',
    slug: 'wild-turkey-101',
    distillery: 'wild-turkey-distillery',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 50.5,
    description: 'Bold and spicy with rich vanilla and caramel notes, underpinned by robust oak.',
    barcodes: ['086041000024'],
    flavorSweet: 0.55, flavorSmoke: 0.1, flavorFruit: 0.35, flavorGrain: 0.65, flavorSpice: 0.75, flavorFloral: 0.1, flavorBody: 0.8,
  },
  {
    name: 'Elijah Craig Small Batch',
    slug: 'elijah-craig-small-batch',
    distillery: 'heaven-hill',
    category: 'Whiskey',
    subcategory: 'Bourbon',
    abv: 47,
    description: 'Rich caramel and vanilla notes, complex spice with hints of eucalyptus and mint.',
    barcodes: ['082000700003'],
    flavorSweet: 0.65, flavorSmoke: 0.1, flavorFruit: 0.4, flavorGrain: 0.6, flavorSpice: 0.6, flavorFloral: 0.2, flavorBody: 0.7,
  },
  // Rye
  {
    name: 'Bulleit Rye',
    slug: 'bulleit-rye',
    distillery: 'diageo',
    category: 'Whiskey',
    subcategory: 'Rye',
    abv: 45,
    description: '95% rye mash bill — bold spice, light toffee, and a long dry finish.',
    barcodes: ['086081000073'],
    flavorSweet: 0.3, flavorSmoke: 0.1, flavorFruit: 0.35, flavorGrain: 0.55, flavorSpice: 0.85, flavorFloral: 0.1, flavorBody: 0.6,
  },
  {
    name: 'Rittenhouse Rye',
    slug: 'rittenhouse-rye',
    distillery: 'heaven-hill',
    category: 'Whiskey',
    subcategory: 'Rye',
    abv: 50,
    description: 'Full-bodied rye with assertive spice, baking chocolate, and a long finish.',
    barcodes: ['082000700010'],
    flavorSweet: 0.3, flavorSmoke: 0.1, flavorFruit: 0.3, flavorGrain: 0.5, flavorSpice: 0.9, flavorFloral: 0.1, flavorBody: 0.7,
  },
  // Scotch
  {
    name: 'Glenfiddich 12 Year',
    slug: 'glenfiddich-12-year',
    distillery: 'william-grant-sons',
    category: 'Whiskey',
    subcategory: 'Single Malt Scotch',
    abv: 40,
    description: 'Fruity and mellow with distinctive pear, creamy toffee, and subtle oak notes.',
    barcodes: ['083872024001'],
    flavorSweet: 0.6, flavorSmoke: 0.1, flavorFruit: 0.75, flavorGrain: 0.45, flavorSpice: 0.25, flavorFloral: 0.4, flavorBody: 0.5,
  },
  {
    name: 'The Macallan 12 Year Sherry Oak',
    slug: 'macallan-12-year-sherry-oak',
    distillery: 'the-macallan',
    category: 'Whiskey',
    subcategory: 'Single Malt Scotch',
    abv: 40,
    description: 'Matured exclusively in sherry-seasoned casks. Rich dried fruit, vanilla, spice, and wood.',
    barcodes: ['080432407264'],
    flavorSweet: 0.7, flavorSmoke: 0.1, flavorFruit: 0.8, flavorGrain: 0.4, flavorSpice: 0.45, flavorFloral: 0.25, flavorBody: 0.75,
  },
  {
    name: 'Laphroaig 10 Year',
    slug: 'laphroaig-10-year',
    distillery: 'laphroaig-distillery',
    category: 'Whiskey',
    subcategory: 'Single Malt Scotch',
    abv: 43,
    description: 'The most richly flavoured of all Scotch whiskies. Uniquely intense peaty, smoky taste.',
    barcodes: ['088004014331'],
    flavorSweet: 0.3, flavorSmoke: 0.95, flavorFruit: 0.2, flavorGrain: 0.3, flavorSpice: 0.4, flavorFloral: 0.15, flavorBody: 0.8,
  },
  {
    name: 'Johnnie Walker Black Label',
    slug: 'johnnie-walker-black-label',
    distillery: 'diageo',
    category: 'Whiskey',
    subcategory: 'Blended Scotch',
    abv: 40,
    description: 'Aged 12 years. Balanced smoky, honey, and vanilla character with long, lingering finish.',
    barcodes: ['087000000108'],
    flavorSweet: 0.55, flavorSmoke: 0.45, flavorFruit: 0.5, flavorGrain: 0.5, flavorSpice: 0.4, flavorFloral: 0.2, flavorBody: 0.65,
  },
  {
    name: 'Johnnie Walker Blue Label',
    slug: 'johnnie-walker-blue-label',
    distillery: 'diageo',
    category: 'Whiskey',
    subcategory: 'Blended Scotch',
    abv: 40,
    description: 'The rarest and most elusive whiskies from across Scotland. Silky and opulent.',
    barcodes: ['087000000191'],
    flavorSweet: 0.65, flavorSmoke: 0.35, flavorFruit: 0.65, flavorGrain: 0.45, flavorSpice: 0.45, flavorFloral: 0.35, flavorBody: 0.8,
  },
  // Irish Whiskey
  {
    name: 'Jameson Irish Whiskey',
    slug: 'jameson-irish-whiskey',
    distillery: 'irish-distillers',
    category: 'Whiskey',
    subcategory: 'Irish Whiskey',
    abv: 40,
    description: 'Triple distilled for smoothness. Perfectly balanced with spicy, nutty notes and vanilla sweetness.',
    barcodes: ['080432407813'],
    flavorSweet: 0.6, flavorSmoke: 0.05, flavorFruit: 0.5, flavorGrain: 0.55, flavorSpice: 0.35, flavorFloral: 0.3, flavorBody: 0.5,
  },
  {
    name: 'Redbreast 12 Year',
    slug: 'redbreast-12-year',
    distillery: 'irish-distillers',
    category: 'Whiskey',
    subcategory: 'Irish Whiskey',
    abv: 40,
    description: 'Pot still Irish whiskey with sherry cask influence. Rich dried fruit, spice, and nuts.',
    barcodes: ['080432401002'],
    flavorSweet: 0.65, flavorSmoke: 0.05, flavorFruit: 0.75, flavorGrain: 0.45, flavorSpice: 0.5, flavorFloral: 0.25, flavorBody: 0.7,
  },
  // Gin
  {
    name: "Hendrick's Gin",
    slug: 'hendricks-gin',
    distillery: 'william-grant-sons',
    category: 'Gin',
    abv: 41.4,
    description: 'Infused with cucumber and rose petals. Unusually floral and refreshing with juniper backbone.',
    barcodes: ['082000733543'],
    flavorSweet: 0.45, flavorSmoke: 0.05, flavorFruit: 0.5, flavorGrain: 0.2, flavorSpice: 0.3, flavorFloral: 0.85, flavorBody: 0.45,
  },
  {
    name: 'Tanqueray London Dry Gin',
    slug: 'tanqueray-london-dry-gin',
    distillery: 'diageo',
    category: 'Gin',
    abv: 47.3,
    description: 'Fresh, crisp juniper with hints of coriander, angelica, and licorice. The classic London dry.',
    barcodes: ['082000730542'],
    flavorSweet: 0.2, flavorSmoke: 0.05, flavorFruit: 0.3, flavorGrain: 0.15, flavorSpice: 0.45, flavorFloral: 0.55, flavorBody: 0.5,
  },
  {
    name: "Bombay Sapphire",
    slug: 'bombay-sapphire',
    distillery: 'bacardi-limited',
    category: 'Gin',
    abv: 47,
    description: 'Vapor infused with 10 botanicals. Light and aromatic with bright citrus and floral notes.',
    barcodes: ['080480100017'],
    flavorSweet: 0.3, flavorSmoke: 0.05, flavorFruit: 0.45, flavorGrain: 0.15, flavorSpice: 0.35, flavorFloral: 0.7, flavorBody: 0.4,
  },
  // Vodka
  {
    name: "Tito's Handmade Vodka",
    slug: 'titos-handmade-vodka',
    distillery: 'titos-handmade-vodka',
    category: 'Vodka',
    abv: 40,
    description: 'Corn-based, pot-distilled six times. Smooth and clean with a light sweetness.',
    barcodes: ['845081060031'],
    flavorSweet: 0.4, flavorSmoke: 0.0, flavorFruit: 0.1, flavorGrain: 0.5, flavorSpice: 0.05, flavorFloral: 0.1, flavorBody: 0.3,
  },
  {
    name: 'Grey Goose',
    slug: 'grey-goose',
    distillery: 'bacardi-limited',
    category: 'Vodka',
    abv: 40,
    description: 'French winter wheat vodka with a soft, elegant texture and subtle almond finish.',
    barcodes: ['083872100087'],
    flavorSweet: 0.3, flavorSmoke: 0.0, flavorFruit: 0.15, flavorGrain: 0.55, flavorSpice: 0.05, flavorFloral: 0.2, flavorBody: 0.35,
  },
  {
    name: 'Belvedere Vodka',
    slug: 'belvedere-vodka',
    distillery: 'diageo',
    category: 'Vodka',
    abv: 40,
    description: 'Polish rye vodka with subtle vanilla, white chocolate, and cream notes.',
    barcodes: ['5900765007011'],
    flavorSweet: 0.35, flavorSmoke: 0.0, flavorFruit: 0.1, flavorGrain: 0.6, flavorSpice: 0.05, flavorFloral: 0.15, flavorBody: 0.4,
  },
  // Tequila
  {
    name: 'Patrón Silver',
    slug: 'patron-silver',
    distillery: 'patron-spirits',
    category: 'Tequila',
    subcategory: 'Blanco',
    abv: 40,
    description: 'Smooth and sweet with a lightly herbed flavor, fresh fruit, and vanilla.',
    barcodes: ['721733001012'],
    flavorSweet: 0.5, flavorSmoke: 0.05, flavorFruit: 0.55, flavorGrain: 0.1, flavorSpice: 0.35, flavorFloral: 0.45, flavorBody: 0.45,
  },
  {
    name: 'Don Julio Blanco',
    slug: 'don-julio-blanco',
    distillery: 'jose-cuervo',
    category: 'Tequila',
    subcategory: 'Blanco',
    abv: 40,
    description: 'Crisp agave flavor with hints of citrus and fruit. Light pepper finish.',
    barcodes: ['721733001197'],
    flavorSweet: 0.45, flavorSmoke: 0.05, flavorFruit: 0.6, flavorGrain: 0.1, flavorSpice: 0.4, flavorFloral: 0.5, flavorBody: 0.4,
  },
  {
    name: "Don Julio 1942",
    slug: 'don-julio-1942',
    distillery: 'jose-cuervo',
    category: 'Tequila',
    subcategory: 'Añejo',
    abv: 40,
    description: 'Aged 2.5 years. Caramel and vanilla sweetness layered with roasted agave and spice.',
    barcodes: ['721733001074'],
    flavorSweet: 0.7, flavorSmoke: 0.1, flavorFruit: 0.5, flavorGrain: 0.15, flavorSpice: 0.45, flavorFloral: 0.35, flavorBody: 0.7,
  },
  // Rum
  {
    name: 'Bacardi Superior',
    slug: 'bacardi-superior',
    distillery: 'bacardi-limited',
    category: 'Rum',
    subcategory: 'White Rum',
    abv: 40,
    description: 'Clean and smooth with subtle vanilla, almond, and coconut notes.',
    barcodes: ['080480100048'],
    flavorSweet: 0.5, flavorSmoke: 0.0, flavorFruit: 0.4, flavorGrain: 0.1, flavorSpice: 0.15, flavorFloral: 0.2, flavorBody: 0.35,
  },
  {
    name: "Diplomatico Reserva Exclusiva",
    slug: 'diplomatico-reserva-exclusiva',
    distillery: 'bacardi-limited',
    category: 'Rum',
    subcategory: 'Dark Rum',
    abv: 40,
    description: 'Complex and indulgent Venezuelan rum. Dark fruit, vanilla, toffee, and orange zest.',
    barcodes: ['082000756351'],
    flavorSweet: 0.85, flavorSmoke: 0.0, flavorFruit: 0.8, flavorGrain: 0.1, flavorSpice: 0.35, flavorFloral: 0.3, flavorBody: 0.8,
  },
  {
    name: "Mount Gay Black Barrel",
    slug: 'mount-gay-black-barrel',
    distillery: 'bacardi-limited',
    category: 'Rum',
    subcategory: 'Dark Rum',
    abv: 43,
    description: 'Double oak matured. Bold vanilla, toasted wood, banana, and warming spice.',
    barcodes: ['082000765353'],
    flavorSweet: 0.65, flavorSmoke: 0.05, flavorFruit: 0.65, flavorGrain: 0.1, flavorSpice: 0.5, flavorFloral: 0.2, flavorBody: 0.7,
  },
];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function main(): Promise<void> {
  console.log('Seeding demo catalog...');

  // Upsert distilleries
  const distilleryMap = new Map<string, string>();
  for (const d of DISTILLERIES) {
    const rec = await prisma.distillery.upsert({
      where: { slug: d.slug },
      create: d,
      update: { name: d.name, region: d.region },
    });
    distilleryMap.set(d.slug, rec.id);
  }
  console.log(`✓ ${DISTILLERIES.length} distilleries`);

  // Upsert categories
  const categoryNames = [...new Set(SPIRITS.map((s) => s.category))];
  const categoryMap = new Map<string, string>();
  for (const name of categoryNames) {
    const slug = slugify(name);
    const rec = await prisma.category.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
    });
    categoryMap.set(name, rec.id);
  }
  console.log(`✓ ${categoryNames.length} categories`);

  // Upsert spirits
  let spiritCount = 0;
  let barcodeCount = 0;
  for (const s of SPIRITS) {
    const spirit = await prisma.spirit.upsert({
      where: { slug: s.slug },
      create: {
        name: s.name,
        slug: s.slug,
        distilleryId: distilleryMap.get(s.distillery) ?? null,
        categoryId: categoryMap.get(s.category) ?? null,
        subcategory: s.subcategory ?? null,
        abv: s.abv,
        description: s.description,
        flavorSweet: s.flavorSweet ?? 0.5,
        flavorSmoke: s.flavorSmoke ?? 0.1,
        flavorFruit: s.flavorFruit ?? 0.4,
        flavorGrain: s.flavorGrain ?? 0.5,
        flavorSpice: s.flavorSpice ?? 0.4,
        flavorFloral: s.flavorFloral ?? 0.2,
        flavorBody: s.flavorBody ?? 0.5,
      },
      update: {
        name: s.name,
        abv: s.abv,
        description: s.description,
      },
    });

    for (const barcode of s.barcodes) {
      await prisma.spiritBarcode.upsert({
        where: { barcode },
        create: { spiritId: spirit.id, barcode },
        update: {},
      });
      barcodeCount++;
    }
    spiritCount++;
    process.stdout.write(`  ✓ ${s.name}\n`);
  }

  console.log(`\nDone: ${spiritCount} spirits, ${barcodeCount} barcodes seeded.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect().finally(() => process.exit(1));
  });
