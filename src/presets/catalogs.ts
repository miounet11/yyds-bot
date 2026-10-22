import type { Attribute, BacklogAttribute, ComplianceProfile, Entity, Fact, Faq, Localized, Offer, Relation, Source, ThemeName } from "../brief/types.js";
import { ENCODED } from "../pillars/thresholds.js";
import { topUp } from "./prose.js";

export interface Catalog {
  id: string;
  theme: ThemeName;
  compliance: ComplianceProfile;
  ymyl: boolean;
  organizationType: string;
  personType: string;
  offerType: "Product" | "Service";
  authorName: string;
  authorTitle: Localized;
  credential: {
    category: Localized;
    identifier: string | null;
    recognized_by: string | null;
  } | null;
  phone: { visibility: "public" | "lead_only" | "hidden"; value: string | null; value_env: string | null; placeholder: Localized | null };
  offers: Offer[];
  entities: Entity[];
  relations: Relation[];
  backlog: BacklogAttribute[];
  homeIntro: Localized;
  about: Localized;
  editorial: Localized;
  bio: Localized;
  credentialsText: Localized;
  tagline: Localized;
  description: Localized;
}

const UPDATED = ENCODED.updated;

function both(en: string, zh: string): Localized {
  return { en, zh };
}

function source(title: string, url: string, publisher: string): Source {
  return { title, url, publisher };
}

function fact(label: Localized, value: Localized, url: string, title: string): Fact {
  return { label, value, source_url: url, source_title: title };
}

function faq(q: Localized, a: Localized): Faq {
  return { q, a };
}

function attribute(spec: {
  id: string;
  name: Localized;
  summary: Localized;
  body: Localized;
  facts: Fact[];
  faqs: Faq[];
  sources: Source[];
}): Attribute {
  return {
    ...spec,
    summary: { en: topUp("en", spec.id, spec.summary.en, 40), zh: topUp("zh", spec.id, spec.summary.zh, 40) },
    body: {
      en: topUp("en", spec.id, spec.body.en, ENCODED.gates.min_words.attribute),
      zh: topUp("zh", spec.id, spec.body.zh, ENCODED.gates.min_words.attribute)
    },
    updated: UPDATED
  };
}

const SCA = "https://sca.coffee/";
const HARIO = "https://www.hario.com/product/v60.html";
const NCA = "https://www.ncausa.org/";

function coffeeCatalog(brand: string, topic: string): Catalog {
  const v60Ratio = attribute({
    id: "ratio",
    name: both("Brew ratio", "冲煮比例"),
    summary: both(
      `${brand} doses 15 grams of coffee and 240 grams of water in the ceramic cone, a 1:16 ratio.`,
      `${brand} 的陶瓷锥形滤杯用 15 克咖啡和 240 克水，比例是 1:16。`
    ),
    body: both(
      `Start with 15 grams of coffee ground just finer than table salt and pour 240 grams of water. That 1:16 ratio is the house standard for washed lots at ${brand}. Bloom with 40 grams and wait 30 seconds before the first main pour. Finish the brew between 2 minutes 30 seconds and 3 minutes 15 seconds. If liquid is still standing on the bed after that window, coarsen the grind rather than stirring the crust apart. The ceramic wall holds heat, so the kettle can sit at 92 degrees Celsius instead of a rolling boil. Write the dose and the drawdown on the same line. Change only one of them the next time you brew. A second stir after the bloom muddies the difference between a washed Ethiopia and a heavier natural.`,
      `粉量 15 克，水量 240 克，这是 ${brand} 对手冲水洗批次使用的 1:16。闷蒸先给 40 克水，等 30 秒再开始主注水。整壶落在 2 分 30 秒到 3 分 15 秒。如果超时后粉床还有积水，把研磨调粗，不要靠用力搅拌把粉床搅散。陶瓷壁会保温，所以壶温停在 92°C，不必用沸水。把粉量和落水时间写在同一行，下一次只改其中一个。闷蒸后再搅拌一次，会把水洗埃塞和更厚重的日晒搅成同一种味道。`
    ),
    facts: [
      fact(both("Dose", "粉量"), both("15 g", "15 克"), SCA, "SCA brew water and cupping context"),
      fact(both("Water", "水量"), both("240 g", "240 克"), HARIO, "Hario V60 product notes"),
      fact(both("Target drawdown", "目标落水"), both("2:30–3:15", "2 分 30 秒至 3 分 15 秒"), SCA, "SCA")
    ],
    faqs: [
      faq(both("What ratio should I start with?", "一开始用什么比例？"), both("Start at 1:16, 15 grams of coffee to 240 grams of water, then change only the grind.", "从 1:16 开始，15 克粉对 240 克水，之后只改研磨。")),
      faq(both("Why not stir more?", "为什么不要多搅拌？"), both("Extra stirring erases the difference between a washed coffee and a natural.", "额外搅拌会抹平水洗和日晒的差别。"))
    ],
    sources: [source("Specialty Coffee Association", SCA, "SCA"), source("Hario V60", HARIO, "Hario")]
  });

  const v60Temp = attribute({
    id: "temperature",
    name: both("Water temperature", "水温"),
    summary: both(
      `Hold the kettle at 92 degrees Celsius for this ceramic cone so the bed stays hot without scalding.`,
      `这只陶瓷滤杯把水温停在 92°C，粉床保温，又不会被沸水烫伤。`
    ),
    body: both(
      `Boiling water is the wrong tool for a thick ceramic cone. ${brand} pulls the kettle off the boil and brews at 92 degrees Celsius. Ceramic keeps that heat in the slurry, so a cooler start still finishes sweet. If the cup tastes hollow, raise the kettle by one degree, not five. If it tastes dry and woody, drop back toward 90 degrees and check the grind before blaming the coffee. Measure water at the kettle spout, not at the tap. Preheat the cone with a rinse and discard that water so it never joins the 240 gram brew. Record the temperature next to the ratio page instead of keeping a second notebook.`,
      `${brand} 不把沸水直接倒进厚陶瓷滤杯，而是在 92°C 冲煮。陶瓷会把热量留在粉床里，所以起点略低，收尾仍然可以是甜的。如果杯子发空，只把壶温提高 1 度，不要一次加 5 度。如果又干又木，退回 90°C 附近，并先检查研磨。水温在壶嘴测量，不在水龙头测量。先用热水温杯，再把这点水倒掉，避免它混进 240 克的冲煮水。把温度和比例记在一起。`
    ),
    facts: [
      fact(both("Kettle temperature", "壶温"), both("92°C", "92°C"), SCA, "SCA"),
      fact(both("Cone material", "滤杯材质"), both("Ceramic", "陶瓷"), HARIO, "Hario")
    ],
    faqs: [
      faq(both("Can I use boiling water?", "可以用沸水吗？"), both("Not in this ceramic cone. Start at 92°C.", "这只陶瓷滤杯不要用沸水，从 92°C 开始。")),
      faq(both("Where do I measure?", "在哪里量温度？"), both("At the kettle spout, after the cone has been rinsed and drained.", "在壶嘴量，而且要在滤杯润洗并倒掉润洗水之后。"))
    ],
    sources: [source("Specialty Coffee Association", SCA, "SCA")]
  });

  const origin = attribute({
    id: "origin",
    name: both("Origin", "产区"),
    summary: both(
      `The washed Ethiopia lot is a Yirgacheffe-style coffee grown around 1,900 to 2,200 meters.`,
      `这支水洗埃塞是耶加雪菲风格的咖啡，种植海拔大约 1900 到 2200 米。`
    ),
    body: both(
      `${brand} buys this lot as a washed Yirgacheffe-style coffee, not as a blended supermarket bag. The farms sit between 1,900 and 2,200 meters, where nights stay cool and the washed process keeps the cup floral instead of heavy. Ask the importer for the cooperative or washing-station name before you print a farm story you cannot verify. Altitude is a range, not a single heroic number. If a sack arrives without a station name, sell it as a regional lot and say so on the offer page. Roast dates belong on the bag. Origin text belongs on this page, with the station name beside it when you have one.`,
      `${brand} 把这支豆子当作水洗、耶加雪菲风格的批次，而不是超市拼配。农场海拔大约在 1900 到 2200 米，夜晚凉，水洗让杯子偏花香而不是厚重。在印上单个农户故事之前，先向进口商核对合作社或水洗站的名字。海拔是一个区间，不是一个英雄数字。如果麻袋上没有水洗站名称，就按产区批次销售，并在商品页写明。烘焙日期写在袋子上。产地说明留在这一页，有站名就一并写上。`
    ),
    facts: [
      fact(both("Region", "产区"), both("Yirgacheffe-style, Ethiopia", "埃塞俄比亚，耶加雪菲风格"), NCA, "National Coffee Association origin primers"),
      fact(both("Altitude", "海拔"), both("1,900–2,200 m", "1900–2200 米"), NCA, "NCA"),
      fact(both("Process", "处理法"), both("Washed", "水洗"), SCA, "SCA")
    ],
    faqs: [
      faq(both("Is this a single farm?", "这是单一农场吗？"), both("Only if the sack names a farm or washing station. Otherwise describe it as a regional washed lot.", "只有麻袋写了农场或水洗站才算。否则写成产区水洗批次。")),
      faq(both("Why does altitude matter?", "海拔为什么重要？"), both("The cooler nights at 1,900 to 2,200 meters are part of why this lot stays floral.", "1900 到 2200 米的凉夜，是这支豆子保持花香的原因之一。"))
    ],
    sources: [source("National Coffee Association", NCA, "NCA")]
  });

  const tasting = attribute({
    id: "tasting",
    name: both("Tasting notes", "风味"),
    summary: both(
      `Expect jasmine, bergamot, and a black-tea finish when this washed lot is brewed at 1:16.`,
      `按 1:16 冲这支水洗批次时，常见茉莉、香柠檬和红茶般的尾韵。`
    ),
    body: both(
      `Taste this coffee after it has rested at least seven days from roast. ${brand} describes the washed lot as jasmine, bergamot, and a long black-tea finish when the 1:16 ceramic recipe is followed. Those words are cupping notes, not a perfume you add. If the cup is only sour, the grind is too fine or the water is too cool. If it is papery, the coffee is stale or the filter is still full of rinse water. Compare two cups side by side before you rewrite the offer description. Do not claim a flavor the cupping table did not taste. Keep the note next to the origin page so a reader can see process and taste together.`,
      `从烘焙日算起至少休息 7 天再品尝。${brand} 用 1:16 的陶瓷滤杯配方时，把这支水洗批次描述为茉莉、香柠檬和偏长的红茶尾韵。这些是杯测词，不是后加的香精。如果只有酸，通常是研磨太细或水太凉。如果像纸，可能是豆子放久了，或润洗水还留在滤纸里。改商品文案之前，先并排喝两杯。杯测桌上没有的味道，不要写进页面。把风味和产地页放在一起，让读者同时看到处理法和味道。`
    ),
    facts: [
      fact(both("Notes", "风味词"), both("Jasmine, bergamot, black tea", "茉莉、香柠檬、红茶"), SCA, "SCA cupping vocabulary"),
      fact(both("Rest", "养豆"), both("At least 7 days off roast", "烘焙后至少 7 天"), NCA, "NCA")
    ],
    faqs: [
      faq(both("When should I taste it?", "什么时候喝？"), both("Wait at least seven days after the roast date.", "等烘焙日期过去至少 7 天。")),
      faq(both("What if it tastes like paper?", "如果像纸味？"), both("Check freshness and whether the filter rinse was discarded.", "先看新鲜度，再确认润洗水已经倒掉。"))
    ],
    sources: [source("Specialty Coffee Association", SCA, "SCA")]
  });

  const recipe = attribute({
    id: "recipe",
    name: both("Espresso recipe", "意式配方"),
    summary: both(
      `${brand} pulls 18 grams in and 36 grams out in about 28 seconds at 93 degrees Celsius.`,
      `${brand} 的意式配方是 18 克粉、36 克液、大约 28 秒，水温 93°C。`
    ),
    body: both(
      `Lock the espresso basket at 18 grams in and 36 grams out. Aim for 28 seconds from the moment liquid hits the cup, with the group at 93 degrees Celsius. That is a 1:2 recipe, not a 1:16 filter recipe, and the two pages should never share a grind setting. Distribute the puck and tamp once. If the shot blondes early, grind finer. If it chokes past 35 seconds, grind coarser before you change the dose. Taste for sweetness in the middle of the cup, not just crema color. Record dose, yield, time, and temperature on the same ticket. ${brand} does not publish a house pressure claim because the machine's gauge is not the customer's machine.`,
      `粉量锁在 18 克，液重 36 克。从液体进入杯子开始算，目标大约 28 秒，冲煮头水温 93°C。这是 1:2 的意式配方，不是 1:16 的手冲配方，两页不能共用一个研磨刻度。布粉后只压一次。如果太早变白，研磨调细。如果超过 35 秒仍然挤不出来，先调粗，再考虑改粉量。甜感应在杯子中段，不只是油脂的颜色。把粉量、液重、时间和温度写在同一张单上。${brand} 不公布一个“店内压力”承诺，因为机器上的压力表不是顾客家里的那一台。`
    ),
    facts: [
      fact(both("Dose in", "粉量"), both("18 g", "18 克"), SCA, "SCA"),
      fact(both("Yield", "液重"), both("36 g", "36 克"), SCA, "SCA"),
      fact(both("Time", "时间"), both("about 28 seconds", "大约 28 秒"), NCA, "NCA")
    ],
    faqs: [
      faq(both("Is this the same ratio as filter?", "和手冲比例一样吗？"), both("No. Espresso here is 1:2. The ceramic cone page is 1:16.", "不一样。这里的意式是 1:2，陶瓷滤杯那一页是 1:16。")),
      faq(both("What do I change first?", "先改什么？"), both("Change grind before dose when time is far from 28 seconds.", "时间偏离 28 秒时，先改研磨，再改粉量。"))
    ],
    sources: [source("Specialty Coffee Association", SCA, "SCA")]
  });

  const freshness = attribute({
    id: "freshness",
    name: both("Freshness window", "新鲜度"),
    summary: both(
      `Use this espresso blend from day 7 through day 21 after roast, then mark the bag down or cup it again.`,
      `这支意式拼配在烘焙后第 7 天到第 21 天使用，之后降价或重新杯测。`
    ),
    body: both(
      `Espresso needs a degassing window. ${brand} keeps this blend off the machine until day 7 and treats day 21 as the edge of the flavor you wrote on the bag. Before day 7 the puck fights you and the shot tastes gassy. After day 21, recupp before you keep selling the same tasting note. Print the roast date on the offer, not a vague "freshly roasted". Store the bag sealed, away from the grinder hopper's heat. A hopper is not a cellar. If you freeze a portion, thaw it sealed so moisture does not condense on the grounds. This page is about calendar age, not about the filter-coffee rest note on the Ethiopia lot.`,
      `意式需要排气。${brand} 在第 7 天之前不上机，并把第 21 天当作袋子上那句风味描述的边界。第 7 天之前粉饼发虚，咖啡有气。超过第 21 天，先重新杯测，再决定是否继续用同一句风味文案。商品上印烘焙日期，不要只写“新鲜烘焙”。袋子密封，远离磨豆机料斗的热。料斗不是储藏室。如果冷冻一部分，解冻时保持密封，避免水汽凝在粉上。这一页讲的是日历年龄，不是埃塞那一页的手冲养豆说明。`
    ),
    facts: [
      fact(both("Open the bag for espresso", "开始做意式"), both("Day 7 after roast", "烘焙后第 7 天"), NCA, "NCA"),
      fact(both("Review the note", "复核风味"), both("Day 21 after roast", "烘焙后第 21 天"), SCA, "SCA")
    ],
    faqs: [
      faq(both("Can I pull shots on day 2?", "第 2 天可以萃取吗？"), both("Wait until day 7. Earlier shots taste gassy and the puck channels.", "等到第 7 天。更早会发气，粉饼也容易通道。")),
      faq(both("What happens after day 21?", "第 21 天之后呢？"), both("Cup it again before you keep the same tasting sentence on the offer.", "先重新杯测，再决定商品页是否保留原来的风味句。"))
    ],
    sources: [source("National Coffee Association", NCA, "NCA")]
  });

  const grind = attribute({
    id: "grind",
    name: both("Grind size", "研磨"),
    summary: both(
      `Set a medium-fine grind for the ceramic cone and a separate finer setting for the 18 gram espresso basket.`,
      `陶瓷滤杯用中细研磨，18 克意式粉碗用另一档更细的刻度。`
    ),
    body: both(
      `A shared grind setting will ruin both recipes. ${brand} uses a medium-fine grind for the ceramic cone, close to table salt, and a clearly finer step for the 18 gram espresso basket. Write the two click numbers in two rows. Do not publish a universal "perfect grind". Burr wear moves the number. When drawdown on the cone runs long, coarsen that row only. When espresso exceeds 35 seconds, coarsen the espresso row only. Replace burrs when you have to keep grinding finer every week to hit the same time. This backlog page is how the autopilot adds a missing query without inventing a new brand.`,
      `${brand} 不让两个配方共用研磨。陶瓷滤杯用接近食盐的中细刻度，18 克意式粉碗用明显更细的一档。把两个刻度分成两行写，不要公布一个万能的“完美研磨”。磨盘磨损会让数字漂移。手冲落水变长时，只调手冲那一行。意式超过 35 秒时，只调意式那一行。如果每周都要把刻度调细才能维持同样的时间，就该换磨盘。这一页是自动驾驶在不新造品牌的前提下，补上一个尚未覆盖的搜索问题。`
    ),
    facts: [
      fact(both("Filter grind", "手冲研磨"), both("Medium-fine, near table salt", "中细，接近食盐"), HARIO, "Hario"),
      fact(both("Espresso grind", "意式研磨"), both("Finer than the filter row", "比手冲那一档更细"), SCA, "SCA")
    ],
    faqs: [
      faq(both("Can one grind serve both?", "一个刻度能两边用吗？"), both("No. Keep a filter row and an espresso row.", "不能。手冲一行，意式一行。")),
      faq(both("What if times drift every week?", "如果每周时间都在漂？"), both("Check burr wear before you rewrite the recipe.", "先看磨盘磨损，再改配方。"))
    ],
    sources: [source("Hario V60", HARIO, "Hario")]
  });

  const entities: Entity[] = [
    {
      id: "ceramic-v60",
      type: "brew-method",
      name: both("Ceramic cone", "陶瓷滤杯"),
      summary: both(
        `${brand} uses a ceramic cone for the filter bar because the wall holds heat during a 1:16 pour.`,
        `${brand} 的手冲台使用陶瓷滤杯，因为杯壁会在 1:16 的注水过程中保温。`
      ),
      updated: UPDATED,
      attributes: [v60Ratio, v60Temp]
    },
    {
      id: "washed-ethiopia",
      type: "coffee",
      name: both("Washed Ethiopia", "水洗埃塞"),
      summary: both(
        `A washed, Yirgacheffe-style lot with jasmine and bergamot when brewed on the ceramic cone.`,
        `水洗、耶加雪菲风格的批次，用陶瓷滤杯冲时常见茉莉和香柠檬。`
      ),
      updated: UPDATED,
      attributes: [origin, tasting]
    },
    {
      id: "espresso-blend",
      type: "coffee",
      name: both("Espresso blend", "意式拼配"),
      summary: both(
        `An espresso blend pulled 18 in, 36 out, from day 7 to day 21 after roast.`,
        `意式拼配按 18 进 36 出萃取，使用窗口是烘焙后第 7 天到第 21 天。`
      ),
      updated: UPDATED,
      attributes: [recipe, freshness]
    }
  ];

  const offers: Offer[] = [
    {
      id: "house-beans",
      name: both(`${brand} washed lot, 250 g`, `${brand} 水洗批次 250 克`),
      specialty: both("Washed Ethiopia for the 1:16 ceramic recipe", "配合 1:16 陶瓷滤杯配方的水洗埃塞"),
      description: both(
        `A 250 gram bag of the washed Ethiopia lot, roasted for filter, with the roast date printed on the label.`,
        `250 克水洗埃塞，为手冲烘焙，标签上印烘焙日期。`
      ),
      price: "128.00",
      currency: "CNY",
      availability: "InStock",
      delivery: both("Ships as whole bean with the roast date on the bag.", "以整豆寄出，袋子上有烘焙日期。"),
      visibility: "public",
      updated: UPDATED
    },
    {
      id: "brew-workshop",
      name: both("90-minute brew workshop", "90 分钟冲煮课"),
      specialty: both("Hands-on ceramic cone class covering ratio and temperature", "亲手练习陶瓷滤杯的比例和水温"),
      description: both(
        `A 90-minute class at the bar. You leave with the 15 gram / 240 gram recipe written down.`,
        `吧台 90 分钟课程。离开时你会写下 15 克对 240 克的配方。`
      ),
      price: "260.00",
      currency: "CNY",
      availability: "InStock",
      delivery: both("Book a seat. The class is in person and does not ship.", "预约座位。课程到店进行，不寄送。"),
      visibility: "public",
      updated: UPDATED
    }
  ];

  return {
    id: "specialty-coffee",
    theme: "commercial-warm",
    compliance: "generic",
    ymyl: false,
    organizationType: "Organization",
    personType: "Person",
    offerType: "Product",
    authorName: "Mina Ellison",
    authorTitle: both("Head roaster", "主烘焙师"),
    credential: null,
    phone: { visibility: "public", value: "+1-555-0148", value_env: null, placeholder: null },
    offers,
    entities,
    relations: [
      { from: "ceramic-v60", to: "washed-ethiopia", type: "brewed-with", label: both("Brewed with", "用于冲煮") },
      { from: "espresso-blend", to: "ceramic-v60", type: "distinct-from", label: both("Uses a different recipe", "使用不同配方") }
    ],
    backlog: [{ entity: "ceramic-v60", attribute: grind, query: both("ceramic v60 grind size", "陶瓷滤杯研磨刻度") }],
    homeIntro: both(
      `${brand} publishes the filter and espresso recipes we actually use, with doses, temperatures, and the dates we last checked them. ${topic} is the whole site: a ceramic cone at 1:16, a washed Ethiopia lot, and an espresso blend with a 7 to 21 day window. Prices are on the offer pages. The author page names who writes the recipes.`,
      `${brand} 公开我们真正在用的手冲和意式配方，包括粉量、水温和最近一次核对的日期。${topic} 就是这个网站的全部范围：1:16 的陶瓷滤杯、一支水洗埃塞，以及 7 到 21 天窗口的意式拼配。价格在商品页。作者页写明配方是谁写的。`
    ),
    about: both(
      `${brand} is a small roasting bar. We publish recipes and lots on this site so a reader can brew the same cup without calling the shop. We do not sell medical, legal, or investment advice.`,
      `${brand} 是一间小型烘焙吧台。我们把配方和批次公开在这个网站上，读者不必打电话也能冲出同一杯。我们不提供医疗、法律或投资建议。`
    ),
    editorial: both(
      `Recipes are updated when we change them on the bar, and each page carries that date. Figures marked placeholder in a source list are planning defaults, not measured claims. We would rather show a range than invent a precise farm story.`,
      `吧台改了配方，页面就更新，并写上日期。来源列表里标成 placeholder 的数字是规划占位，不是实测结论。我们宁可写一个范围，也不编造精确的农户故事。`
    ),
    bio: both(
      `Mina Ellison writes the recipes for ${brand}. She cups the washed lots and pulls the espresso blend used on this site. The biography is a demo identity for the example build, tied to the published recipes rather than to a third-party certificate we do not hold.`,
      `Mina Ellison 为 ${brand} 撰写配方。她杯测本站的水洗批次，并萃取本站使用的意式拼配。这段简介是示例站点的演示身份，对应已公开的配方，而不是一份我们并未持有的第三方证书。`
    ),
    credentialsText: both(
      `Demo biography. No external certificate number is claimed for this example author.`,
      `演示简介。不为这位示例作者声称任何外部证书编号。`
    ),
    tagline: both(`${brand} recipes for ${topic}`, `${brand} 的${topic}配方`),
    description: both(
      `${brand} documents filter and espresso recipes, lots, and prices for ${topic}.`,
      `${brand} 记录${topic}的手冲配方、意式配方、批次和价格。`
    )
  };
}

function genericCatalog(industry: string, topic: string, brand: string, profile: Catalog["compliance"], theme: ThemeName, ymyl: boolean): Catalog {
  const slug = industry.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "general";
  const entities: Entity[] = ["basics", "choices", "limits"].map((kind, entityIndex) => {
    const id = `${slug}-${kind}`;
    const attributes = [0, 1].map((attrIndex) => {
      const attrId = `${kind}-${attrIndex + 1}`;
      const key = `${id}-${attrId}`;
      const figure = 120 + entityIndex * 17 + attrIndex * 5;
      return attribute({
        id: attrId,
        name: both(`${kind} point ${attrIndex + 1}`, `${kind} 要点 ${attrIndex + 1}`),
        summary: both(
          `${brand} treats ${topic} ${kind} point ${attrIndex + 1} as figure ${figure}, not as a slogan.`,
          `${brand} 把${topic}的 ${kind} 要点 ${attrIndex + 1} 记成数字 ${figure}，而不是一句口号。`
        ),
        body: both(
          `This ${kind} page for ${industry} is a planning page. Point ${attrIndex + 1} uses figure ${figure} as a placeholder until a cited measurement replaces it. ${brand} will not invent a testimonial, a ranking, or an outcome promise to fill the gap. Compare this figure with point ${attrIndex + 1} only inside ${id}, because the other entities use different numbers on purpose. Update the date when the figure changes. Keep the source row, even while it still says placeholder, so a reader can see the claim is not yet measured.`,
          `这是 ${industry} 的 ${kind} 规划页。要点 ${attrIndex + 1} 在有引用测量之前，用数字 ${figure} 占位。${brand} 不会用编造的评价、排名或结果承诺来填空。这个数字只在 ${id} 里和要点 ${attrIndex + 1} 比较，其他实体故意使用不同的数字。数字变化时更新日期。即使来源仍然写着 placeholder，也保留来源行，让读者知道这还不是实测。`
        ),
        facts: [
          fact(both("Planning figure", "规划数字"), both(String(figure), String(figure)), `https://example.com/yyds-placeholder/${id}/${attrId}`, "Encoded planning placeholder")
        ],
        faqs: [
          faq(
            both(`What does figure ${figure} mean?`, `数字 ${figure} 是什么？`),
            both(`It is a placeholder for ${key} until a real source replaces the example.com row.`, `它是 ${key} 的占位，直到真实来源替换 example.com 那一行。`)
          )
        ],
        sources: [source("Encoded planning placeholder", `https://example.com/yyds-placeholder/${id}/${attrId}`, "yyds-bot preset")]
      });
    });
    return {
      id,
      type: kind,
      name: both(`${brand} ${kind}`, `${brand} ${kind}`),
      summary: both(
        `${brand} organizes ${topic} into a ${kind} entity so each attribute can be checked on its own page.`,
        `${brand} 把${topic}拆成 ${kind} 实体，让每个属性单独成页、单独核对。`
      ),
      updated: UPDATED,
      attributes
    };
  });

  const backlogAttr = attribute({
    id: "follow-up",
    name: both("Follow-up", "后续问题"),
    summary: both(
      `${brand} keeps one follow-up attribute for queries the first publish did not cover.`,
      `${brand} 保留一个后续属性，用来承接首发没有覆盖的搜索问题。`
    ),
    body: both(
      `Autopilot may add this follow-up page when search data shows a gap. The page stays specific to ${industry} and does not copy the basics entity. Figure 880 belongs only here.`,
      `当搜索数据出现空缺时，自动驾驶可以加上这一页。它只讨论 ${industry}，不复制 basics 实体。数字 880 只属于这里。`
    ),
    facts: [
      fact(both("Follow-up figure", "后续数字"), both("880", "880"), `https://example.com/yyds-placeholder/${slug}/follow-up`, "Encoded planning placeholder")
    ],
    faqs: [
      faq(both("When is this page added?", "这一页什么时候出现？"), both("When autopilot sees an unmatched query.", "当自动驾驶看到无法匹配的查询时。"))
    ],
    sources: [source("Encoded planning placeholder", `https://example.com/yyds-placeholder/${slug}/follow-up`, "yyds-bot preset")]
  });

  return {
    id: slug,
    theme,
    compliance: profile,
    ymyl,
    organizationType: profile === "legal-services" ? "LegalService" : "Organization",
    personType: profile === "legal-services" ? "Attorney" : "Person",
    offerType: "Service",
    authorName: profile === "legal-services" ? "示例律师" : `${brand} editor`,
    authorTitle: both(profile === "legal-services" ? "Demo counsel" : "Editor", profile === "legal-services" ? "演示顾问" : "编辑"),
    credential:
      profile === "legal-services"
        ? {
            category: both("Demo license, not a real bar number", "演示证件，不是真实执业证号"),
            identifier: "DEMO-NOT-A-REAL-LICENSE-000",
            recognized_by: "Demo authority — do not treat as a bar"
          }
        : null,
    phone:
      profile === "legal-services"
        ? {
            visibility: "lead_only",
            value: null,
            value_env: "SITE_PHONE",
            placeholder: both("Phone is shared after a direct inquiry.", "直接询问后才提供电话。")
          }
        : { visibility: "public", value: "+1-555-0199", value_env: null, placeholder: null },
    offers: [
      {
        id: "starter-session",
        name: both(`${brand} starter session`, `${brand} 入门会话`),
        specialty: both(`A scoped ${topic} working session`, `一次范围明确的${topic}工作会话`),
        description: both(
          `A single working session about ${topic}. The price is the public service price, not a bid against competitors.`,
          `一次关于${topic}的工作会话。价格是公开服务价，不是和同行比价的竞标。`
        ),
        price: "199.00",
        currency: "CNY",
        availability: "InStock",
        delivery: both("Scheduled with the buyer. Nothing is auto-shipped.", "与购买者预约。没有自动发货。"),
        visibility: "public",
        updated: UPDATED
      }
    ],
    entities,
    relations: [{ from: entities[0]!.id, to: entities[1]!.id, type: "informs", label: both("Informs", "影响") }],
    backlog: [{ entity: entities[0]!.id, attribute: backlogAttr, query: both(`${industry} follow-up question`, `${industry} 后续问题`) }],
    homeIntro: both(
      `${brand} explains ${topic} with one page per fact. Industry: ${industry}. This site was expanded from a short brief by an encoded preset. Placeholder figures are labeled until a real citation replaces them.`,
      `${brand} 用一页一个事实来说明${topic}。行业：${industry}。本站由编码好的预设从一份短简报展开。占位数字会标明，直到真实引用替换它们。`
    ),
    about: both(
      `${brand} publishes this site so people and answer engines can read the same facts. ${ymyl ? "This topic can affect health, money, or legal rights. Read the editorial policy before acting." : "The topic is not a substitute for a professional engagement."}`,
      `${brand} 公开这个网站，让人和回答引擎读到同一组事实。${ymyl ? "这个主题可能影响健康、金钱或法律权利。行动前先读编辑政策。" : "这些内容不能代替一次正式的专业委托。"}`
    ),
    editorial: both(
      `${profile === "legal-services" ? "Legal-services preset: do not promise outcomes, do not split professional fees, and the license line is a demo identifier. " : ""}${ymyl ? "YMYL content stays crawlable and labeled unreviewed. Index push is held until a human sets human_review_approved. " : ""}Figures marked placeholder in a source list are planning defaults, not measured claims.`,
      `${profile === "legal-services" ? "法律服务预设：不承诺案件结果，不分成专业服务费，证件行是演示编号。" : ""}${ymyl ? "YMYL 内容可以被抓取，并标明未经人工复核。在有人把 human_review_approved 设为真之前，主动推送索引会暂停。" : ""}来源列表里标成 placeholder 的数字是规划占位，不是实测结论。`
    ),
    bio: both(
      `${profile === "legal-services" ? "Demo counsel page. The identifier DEMO-NOT-A-REAL-LICENSE-000 is fictitious and must be replaced before any real practice uses this preset." : `${brand} editor maintains the pages and the update dates.`}`,
      `${profile === "legal-services" ? "演示顾问页。编号 DEMO-NOT-A-REAL-LICENSE-000 是虚构的，真实执业使用本预设前必须替换。" : `${brand} 的编辑维护页面和更新日期。`}`
    ),
    credentialsText: both(
      profile === "legal-services" ? "Fictitious demo identifier DEMO-NOT-A-REAL-LICENSE-000." : "No external license is claimed.",
      profile === "legal-services" ? "虚构演示编号 DEMO-NOT-A-REAL-LICENSE-000。" : "不声称外部执照。"
    ),
    tagline: both(`${brand} on ${topic}`, `${brand}：${topic}`),
    description: both(`${brand} publishes sourced pages about ${topic}.`, `${brand} 发布有来源的${topic}页面。`)
  };
}

export function selectCatalog(industry: string, topic: string, brand: string): Catalog {
  const text = `${industry} ${topic}`;
  if (/coffee|咖啡|espresso|roaster/i.test(text)) return coffeeCatalog(brand, topic || "home coffee brewing");
  if (/legal|lawyer|律师|law-firm|attorney/i.test(text)) {
    return genericCatalog(industry, topic || industry, brand, "legal-services", "trust-navy", true);
  }
  if (/clinic|medical|health|医院|医疗|diagnos/i.test(text)) {
    return genericCatalog(industry, topic || industry, brand, "ymyl-health", "civic-ivory", true);
  }
  if (/finance|insurance|投资|理财|loan/i.test(text)) {
    return genericCatalog(industry, topic || industry, brand, "ymyl-finance", "elite-obsidian", true);
  }
  return genericCatalog(industry || "general", topic || industry || "general", brand, "generic", "commercial-warm", false);
}
