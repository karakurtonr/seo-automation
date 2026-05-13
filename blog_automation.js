import fetch from 'node-fetch';

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const BLOG_ID = '118626779423';

const ARTICLE_TOPICS = [
  { title: "How to Style Women's Leather Loafers for Every Occasion", keyword: "women's leather loafers", collection: "loafers", pexels: "women loafer flat shoes closeup" },
  { title: "Leather vs Suede Loafers: Which Should You Buy?", keyword: "leather loafers women", collection: "loafers", pexels: "suede loafer shoes women" },
  { title: "The Best Women's Loafers for Work and the Office", keyword: "loafers women work", collection: "loafers", pexels: "women loafers office work shoes" },
  { title: "How to Break In Leather Loafers Without the Pain", keyword: "leather loafers women", collection: "loafers", pexels: "leather loafer shoes detail" },
  { title: "How to Style Ankle Boots: 5 Outfits That Always Work", keyword: "ankle boots women", collection: "ankle-boots-2", pexels: "women ankle boots outfit street" },
  { title: "Knee High Boots: The Complete Style Guide for Women", keyword: "knee high boots women", collection: "knee-high-boots", pexels: "women knee high leather boots" },
  { title: "Leather Boots Care Guide: How to Make Them Last Years", keyword: "leather boots women", collection: "leather-boots", pexels: "leather boots care polish detail" },
  { title: "How to Wear Knee High Boots With Every Outfit", keyword: "knee high boots women", collection: "knee-high-boots", pexels: "tall leather boots women fashion" },
  { title: "Ankle Boots vs Chelsea Boots: What's the Difference?", keyword: "ankle boots women", collection: "ankle-boots-2", pexels: "ankle boots women fall fashion" },
  { title: "The Best Leather Ankle Boots for Women in 2026", keyword: "leather ankle boots women", collection: "leather-boots", pexels: "leather ankle boots women closeup" },
  { title: "Why Leather Ballet Flats Are Having a Major Moment in 2026", keyword: "leather ballet flats", collection: "ballerina-flats", pexels: "ballet flat shoes women closeup" },
  { title: "How to Style Ballerina Flats: From Office to Weekend", keyword: "ballerina flats women", collection: "ballerina-flats", pexels: "ballerina flats women outfit" },
  { title: "The Best Ballet Flats for Women Who Are on Their Feet All Day", keyword: "comfortable ballet flats women", collection: "ballerina-flats", pexels: "comfortable flat shoes women" },
  { title: "Kitten Heels: Why Every Woman Needs a Pair in 2026", keyword: "kitten heels women", collection: "heels", pexels: "kitten heel shoes women closeup" },
  { title: "How to Walk in Heels Comfortably: A Practical Guide", keyword: "comfortable heels women", collection: "heels", pexels: "women heels shoes fashion" },
  { title: "Block Heels vs Stilettos: Which Is Better for All-Day Wear?", keyword: "block heels women", collection: "wedding-block-heels", pexels: "block heel shoes women closeup" },
  { title: "The Best Black Heels for Women: A Complete Guide", keyword: "black heels women", collection: "black-heels", pexels: "black heels shoes women closeup" },
  { title: "Platform Sandals: How to Style Them for Summer 2026", keyword: "platform sandals women", collection: "leather-sandals", pexels: "platform sandals women summer closeup" },
  { title: "Leather Slide Sandals: The Summer Essential You Need", keyword: "leather slide sandals women", collection: "sandals", pexels: "leather slide sandals women" },
  { title: "How to Care for Leather Sandals So They Last All Summer", keyword: "leather sandals women", collection: "leather-sandals", pexels: "leather sandals care summer" },
  { title: "Mary Jane Shoes Are Back: How to Wear Them in 2026", keyword: "mary jane shoes women", collection: "mary-janes", pexels: "mary jane shoes women closeup" },
  { title: "Wedge Sandals: The Most Comfortable Heel You Can Wear", keyword: "wedge sandals women", collection: "wedges", pexels: "wedge sandals women summer closeup" },
  { title: "Leather Sneakers for Women: Why They Beat Canvas Every Time", keyword: "leather sneakers women", collection: "leather-sneakers", pexels: "leather sneakers women white closeup" },
  { title: "How to Style White Sneakers With Any Outfit", keyword: "white sneakers women", collection: "sneakers", pexels: "white sneakers women casual outfit" },
];

async function getPexelsPhoto(query) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  const data = await res.json();
  if (!data.photos || data.photos.length === 0) return null;
  const idx = Math.floor(Math.random() * Math.min(data.photos.length, 8));
  const photo = data.photos[idx];
  return {
    url: photo.src.large2x,
    alt: photo.alt || query,
  };
}

async function getCollectionProducts(collectionHandle) {
  // Step 1: Get collection ID
  const res = await fetch(
    `https://${STORE}/admin/api/2024-01/smart_collections.json?handle=${collectionHandle}&fields=id,title,handle`,
    { headers: { 'X-Shopify-Access-Token': TOKEN } }
  );
  const data = await res.json();
  const collections = data.smart_collections || [];
  if (collections.length === 0) return [];
  const collectionId = collections[0].id;

  // Step 2: Get product IDs from collection
  const prodRes = await fetch(
    `https://${STORE}/admin/api/2024-01/collections/${collectionId}/products.json?limit=20&fields=id,handle`,
    { headers: { 'X-Shopify-Access-Token': TOKEN } }
  );
  const prodData = await prodRes.json();
  const productList = prodData.products || [];
  if (productList.length === 0) return [];

  // Shuffle for variety
  const shuffled = [...productList].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 10);

  // Step 3: Fetch full product details (with variants + images) for each
  const fullProducts = await Promise.all(
    selected.map(async p => {
      const r = await fetch(
        `https://${STORE}/admin/api/2024-01/products/${p.id}.json?fields=title,handle,images,variants`,
        { headers: { 'X-Shopify-Access-Token': TOKEN } }
      );
      const d = await r.json();
      return d.product;
    })
  );

  return fullProducts
    .filter(p => p && p.images && p.images.length > 0)
    .map(p => ({
      title: p.title,
      url: `/products/${p.handle}`,
      image: p.images[0].src,
      price: parseFloat(p.variants?.[0]?.price || 0).toFixed(2),
    }));
}

async function generateArticle(topic, products) {
  const prompt = `You are a content writer for Forever & Always Shoes, a women's footwear brand selling genuine leather handmade shoes crafted in Turkey. Price range $59-$199.

Write a blog article for our Style Guide blog. Target keyword: "${topic.keyword}"
Article title: "${topic.title}"

Rules:
- Warm, knowledgeable tone — like a stylish friend giving real advice
- 600-700 words total
- 3-4 H2 sections, naturally varied headings
- Mention "genuine leather" and "handmade in Turkey" at least once each
- DO NOT use: timeless, chic, elevate, effortless, sophisticated, stunning, luxurious, perfect
- Reference specific colors naturally (cognac, taupe, black, beige, suede)
- End with a short paragraph that leads naturally to shopping
- HTML using only <p> and <h2> tags
- Return ONLY valid JSON, no markdown:

{
  "seo_title": "max 60 chars, keyword-rich",
  "seo_description": "max 155 chars, ends with Shop now.",
  "tags": ["5-7 relevant tags"],
  "body_html": "full article HTML with <h2> and <p> tags only, no intro heading"
}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  const text = data.content[0].text.trim().replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch(e) {
    console.log('  ❌ JSON parse error. Raw:', text.substring(0, 300));
    throw e;
  }
}

function makeRow(prods) {
  return `<div style="display:flex;gap:12px;margin:28px 0;">` +
    prods.map(p => `
    <div style="flex:1;min-width:0;">
      <a href="${p.url}" style="text-decoration:none;color:inherit;display:block;">
        <img src="${p.image}" alt="${p.title}" style="width:100%;aspect-ratio:1;object-fit:cover;margin-bottom:6px;" />
        <p style="margin:0 0 2px 0;font-size:11px;font-weight:500;line-height:1.3;">${p.title}</p>
        <p style="margin:0;font-size:11px;color:#666;">$${p.price}</p>
      </a>
    </div>`).join('') + `</div>`;
}

function buildBodyHtml(articleData, products, collectionHandle) {
  let body = articleData.body_html;

  if (products.length > 0) {
    // Inject 3 products after the 3rd H2
    const shuffled = [...products].sort(() => Math.random() - 0.5);
    let h2Count = 0;
    let insertPos = -1;
    let searchFrom = 0;
    while (h2Count < 3) {
      const pos = body.indexOf('</h2>', searchFrom);
      if (pos === -1) break;
      h2Count++;
      if (h2Count === 3) {
        // Find end of section (next <h2> or end of body)
        const nextH2 = body.indexOf('<h2>', pos + 5);
        insertPos = nextH2 === -1 ? body.length : nextH2;
      }
      searchFrom = pos + 5;
    }

    if (insertPos !== -1) {
      const midRow = makeRow(shuffled.slice(0, 3));
      body = body.slice(0, insertPos) + midRow + body.slice(insertPos);
    }

    // 5 products at end
    const endRow = `<div style="margin:48px 0 32px 0;border-top:1px solid #eee;padding-top:32px;"><p style="font-weight:700;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 20px 0;">Shop This Collection</p>` + makeRow(shuffled.slice(0, 5)) + `</div>`;
    body += endRow;
  }

  // CTA block
  const ctaBlock = `<div style="background-color:#1a1a1a;padding:32px;margin:40px 0;text-align:center;"><p style="color:#ffffff;font-size:18px;font-weight:600;margin:0 0 8px 0;">Shop the Collection</p><p style="color:#c9a97a;margin:0 0 20px 0;">Genuine leather · Handmade in Turkey · Free shipping US, UK & Europe</p><a href="/collections/${collectionHandle}" style="background-color:#c9a97a;color:#1a1a1a;padding:14px 32px;text-decoration:none;font-weight:600;display:inline-block;">Shop Now →</a></div>`;

  return body + ctaBlock;
}

async function publishArticle(title, bodyHtml, seoTitle, seoDescription, tags, heroImageUrl) {
  const articlePayload = {
    title,
    body_html: bodyHtml,
    published: true,
    metafields_global_title_tag: seoTitle,
    metafields_global_description_tag: seoDescription,
    tags: tags.join(', '),
  };

  // Send Pexels image as featured image only (tema hero için)
  if (heroImageUrl) {
    articlePayload.image = { src: heroImageUrl };
  }

  const res = await fetch(
    `https://${STORE}/admin/api/2024-01/blogs/${BLOG_ID}/articles.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ article: articlePayload }),
    }
  );
  const data = await res.json();
  if (!data.article) {
    console.log(`  ❌ Shopify error:`, JSON.stringify(data));
  }
  return data.article;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const COUNT = parseInt(process.argv[2]) || 2;
  console.log(`\n🚀 Blog Automation — Publishing ${COUNT} article(s)\n`);

  // Category rotation - read last used index from file
  const fs = await import('fs');
  const rotationFile = `${process.env.HOME}/seo-automation/.blog_rotation`;
  let lastIndex = 0;
  try {
    lastIndex = parseInt(fs.default.readFileSync(rotationFile, 'utf8').trim()) || 0;
  } catch(e) { lastIndex = 0; }

  // Group topics by category
  const categories = [
    ARTICLE_TOPICS.filter(t => t.collection.includes('loafer')),
    ARTICLE_TOPICS.filter(t => t.collection.includes('boot') || t.collection.includes('knee')),
    ARTICLE_TOPICS.filter(t => t.collection.includes('heel') || t.collection.includes('block') || t.collection.includes('black-heels')),
    ARTICLE_TOPICS.filter(t => t.collection.includes('sandal') || t.collection.includes('leather-sandal')),
    ARTICLE_TOPICS.filter(t => t.collection.includes('flat') || t.collection.includes('ballerina') || t.collection.includes('mary') || t.collection.includes('mule') || t.collection.includes('espa')),
    ARTICLE_TOPICS.filter(t => t.collection.includes('sneaker')),
    ARTICLE_TOPICS.filter(t => t.collection.includes('wedge')),
    ARTICLE_TOPICS.filter(t => t.collection.includes('bridal') || t.collection.includes('lace') || t.collection.includes('pearl') || t.collection.includes('velvet') || t.collection.includes('ribbon') || t.collection.includes('strappy')),
  ].filter(cat => cat.length > 0);

  // Pick from next category in rotation
  const catIndex = lastIndex % categories.length;
  const category = categories[catIndex];
  const shuffledCat = [...category].sort(() => Math.random() - 0.5);
  const toPublish = shuffledCat.slice(0, COUNT);

  // Save next index
  fs.default.writeFileSync(rotationFile, String(catIndex + 1));
  console.log(`📂 Category rotation: ${catIndex + 1}/${categories.length} (${toPublish[0]?.collection || '?'})`);

  let success = 0;

  for (const topic of toPublish) {
    console.log(`\n📝 Writing: "${topic.title}"`);

    try {
      console.log(`  🛍️  Fetching products from [${topic.collection}]...`);
      const products = await getCollectionProducts(topic.collection);
      console.log(`  ✅ Products: ${products.length} found`);

      // Use first product image as hero featured image
      const heroImageUrl = products.length > 0 ? products[0].image : null;
      if (heroImageUrl) console.log(`  ✅ Hero: product image from collection`);

      console.log(`  🤖 Generating article content...`);
      const articleData = await generateArticle(topic, products);

      const fullHtml = buildBodyHtml(articleData, products, topic.collection);

      console.log(`  📤 Publishing to Shopify...`);
      const article = await publishArticle(
        topic.title,
        fullHtml,
        articleData.seo_title,
        articleData.seo_description,
        articleData.tags,
        heroImageUrl
      );

      if (article?.id) {
        console.log(`  ✅ Published! ID: ${article.id}`);
        console.log(`  🔗 /blogs/style-guide/${article.handle}`);
        success++;
      } else {
        console.log(`  ❌ Failed:`, JSON.stringify(article));
      }

      await sleep(2000);
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
    }
  }

  console.log(`\n=============================`);
  console.log(`✅ Published: ${success}/${COUNT}`);
  console.log(`=============================\n`);
}

main();
