import type { Localized } from "../brief/types.js";

/** Explicit UI pack. A brief must name this pack; unknown languages fail validation. */
export const EN_ZH_V1: Record<string, Localized> = {
  skip: { en: "Skip to content", zh: "跳到正文" },
  nav_about: { en: "About", zh: "关于" },
  nav_author: { en: "Author", zh: "作者" },
  nav_contact: { en: "Contact", zh: "联系" },
  nav_editorial: { en: "Editorial policy", zh: "编辑政策" },
  nav_offers: { en: "Offers", zh: "服务与商品" },
  nav_entities: { en: "Topics", zh: "主题" },
  nav_faq: { en: "FAQ", zh: "常见问题" },
  nav_search: { en: "Search", zh: "搜索" },
  fact: { en: "Fact", zh: "事实" },
  value: { en: "Value", zh: "取值" },
  source: { en: "Source", zh: "来源" },
  updated: { en: "Last updated", zh: "最近更新" },
  answer_label: { en: "Short answer", zh: "简要回答" },
  faq_label: { en: "Questions and answers", zh: "问答" },
  offers_label: { en: "Offers", zh: "可购买项目" },
  buy: { en: "Continue", zh: "继续" },
  close: { en: "Close", zh: "关闭" },
  phone: { en: "Phone", zh: "电话" },
  note: { en: "Note", zh: "备注" },
  demo_pay: { en: "Confirm demo receipt", zh: "确认演示回执" },
  receipt: { en: "Demo receipt", zh: "演示回执" },
  related: { en: "Related", zh: "相关" },
  breadcrumb_home: { en: "Home", zh: "首页" },
  search_label: { en: "Search this site", zh: "站内搜索" },
  lead_only_cta: { en: "Shared after a direct inquiry", zh: "直接询问后提供" },
  read_md: { en: "Markdown version", zh: "Markdown 版本" },
  price: { en: "Price", zh: "价格" },
  delivery: { en: "Delivery", zh: "交付方式" },
  specialty: { en: "Specialty", zh: "专业点" },
  sources: { en: "Sources", zh: "引用" },
  author: { en: "Author", zh: "作者" },
  footer_note: {
    en: "Facts on this site come from the project brief. Demo checkout does not take payment.",
    zh: "本站事实来自项目简报。演示结账不发生真实支付。"
  },
  search_placeholder: { en: "Search pages", zh: "搜索页面" },
  bottom_offers: { en: "Offers", zh: "选购" },
  bottom_contact: { en: "Contact", zh: "联系" },
  machine_note: {
    en: "This checkout is a static demo state machine. It records nothing on a server and charges nothing.",
    zh: "此结账是静态演示状态机，不向服务器记录信息，也不扣款。"
  },
  language: { en: "Language", zh: "语言" },
  entities_intro: { en: "Topic pages", zh: "主题页" },
  offers_intro: { en: "What you can buy or book", zh: "可购买或预约的项目" },
  contact_intro: { en: "How to reach the publisher", zh: "如何联系发布者" },
  hidden_omitted: { en: "This field is omitted from the public site.", zh: "该字段不出现在公开站点。" },
  table_caption: { en: "Data the page is willing to stand behind", zh: "本页公开的数据" },
  ai_ref: { en: "Referral", zh: "来源标记" }
};

export const UI_KEYS = Object.keys(EN_ZH_V1);
