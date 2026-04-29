export interface WordStyle {
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  color?: string;
  lineHeight?: string;
  letterSpacing?: string;
  isOutline?: boolean;
  outlineWidth?: string;
}

export interface HeroData {
  title: string;
  subtitle: string;
  logoSize?: string;
  videoUrl: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  videoUrl: string;
  imageUrl: string;
  category: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
}

export interface AboutData {
  title: string;
  content: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export interface ContactItem {
  id: string;
  label: string;
  value: string;
  link: string;
  icon: string;
}

export interface ContactData {
  email: string;
  instagram: string;
  address: string;
  items?: ContactItem[];
}

export interface SectionConfig {
  id: string;
  type: 'hero' | 'works' | 'about' | 'expertise' | 'numbers' | 'clients' | 'contact';
  visible: boolean;
  order: number;
  bgImageUrl?: string;
  bgOpacity?: number;
  bgColor?: string;
  bgGradient?: string;
  bgType?: 'image' | 'color' | 'gradient';
  paddingTop?: number;
  paddingBottom?: number;
}

export interface StyleConfig {
  fontFamily: string;
  titleSize: string;
  spacing: string;
  titleAlign?: 'left' | 'center' | 'right';
}

export interface SectionStyles {
  titleAlign?: 'left' | 'center' | 'right';
}

export interface ClientLogo {
  id: string;
  imageUrl: string;
  name?: string;
}

export interface NumberItem {
  id: string;
  value: string;
  label: string;
}

export interface SiteData {
  hero: HeroData;
  portfolio: PortfolioItem[];
  about: AboutData;
  services: ServiceItem[];
  clients?: ClientLogo[];
  numbers?: NumberItem[];
  contact: ContactData;
  sections?: SectionConfig[];
  styles?: StyleConfig;
  outlinedWords?: string[];
  wordStyles?: Record<string, WordStyle>;
  worksTitle?: string;
  expertiseTitle?: string;
  numbersTitle?: string;
  contactTitle?: string;
  sectionStyles?: Record<string, SectionStyles>;
  mobileData?: Partial<Omit<SiteData, 'mobileData'>>;
}

export const DEFAULT_SITE_DATA: SiteData = {
  hero: {
    title: "WORD FILMS",
    subtitle: "AUDIOVISUAL ESTRATÉGICO",
    logoSize: "200px",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cinematic-view-of-a-mountain-landscape-4240-large.mp4"
  },
  portfolio: [
    {
      id: "1",
      title: "UMA ITALIA BRASILEIRA",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cinematic-view-of-a-mountain-landscape-4240-large.mp4",
      imageUrl: "https://picsum.photos/seed/peak/1920/1080",
      category: "DOCUMENTARY"
    },
    {
      id: "2",
      title: "CAFÉ PILÃO",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-4241-large.mp4",
      imageUrl: "https://picsum.photos/seed/urban/1920/1080",
      category: "COMMERCIAL"
    },
    {
      id: "3",
      title: "TU ÉS / ÁGUAS PURIFICADORAS",
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-cinematic-view-of-a-mountain-landscape-4240-large.mp4",
      imageUrl: "https://picsum.photos/seed/nature/1920/1080",
      category: "MUSIC VIDEO"
    }
  ],
  about: {
    title: "NOSSA VISÃO",
    content: "Somos uma produtora dedicada a criar experiências cinematográficas que impactam. Nossa missão é contar histórias que inspiram e cativam audiências em todo o mundo.",
    imageUrl: "https://picsum.photos/seed/vision/1200/1500",
    imageWidth: 550,
    imageHeight: 750
  },
  services: [
    { id: "1", title: "DIREÇÃO", description: "Do conceito ao corte final, cuidamos de todos os aspectos da produção cinematográfica." },
    { id: "2", title: "GRAVAÇÃO", description: "Conteúdo visual de alto impacto para marcas e empresas que buscam excelência." },
    { id: "3", title: "PÓS-PRODUÇÃO", description: "Edição especializada, correção de cor e design de som de nível profissional." }
  ],
  clients: [
    { id: "1", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Ita%C3%BA_Unibanco_logo.svg", name: "Itaú" },
    { id: "2", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Red_Bull_logo.svg", name: "Red Bull" },
    { id: "3", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/0/00/Africa_logo_2022.svg", name: "Africa" }
  ],
  numbers: [
    { id: "1", value: "300", label: "PRODUÇÕES" },
    { id: "2", value: "500", label: "VÍDEOS PRODUZIDOS" },
    { id: "3", value: "10", label: "PROJETOS INTERNACIONAIS" },
    { id: "4", value: "14", label: "MARCAS ATENDIDAS" },
    { id: "5", value: "11", label: "ANOS DE MERCADO" }
  ],
  contact: {
    email: "contato@wordfilms.com",
    instagram: "@wordfilmsofc",
    address: "Rio de Janeiro, Brasil",
    items: [
      { id: "1", label: "Email", value: "contato@wordfilms.com", link: "mailto:contato@wordfilms.com", icon: "Mail" },
      { id: "2", label: "Instagram", value: "@wordfilmsofc", link: "https://instagram.com/wordfilmsofc", icon: "Instagram" },
      { id: "3", label: "Localização", value: "Rio de Janeiro, Brasil", link: "", icon: "MapPin" }
    ]
  },
  sections: [
    { id: "s1", type: "hero", visible: true, order: 1, bgImageUrl: "", bgOpacity: 50, bgType: 'image' },
    { id: "s2", type: "works", visible: true, order: 2, bgImageUrl: "", bgOpacity: 50, bgType: 'image' },
    { id: "s3", type: "about", visible: true, order: 3, bgImageUrl: "", bgOpacity: 50, bgType: 'image' },
    { id: "s4", type: "expertise", visible: true, order: 4, bgImageUrl: "", bgOpacity: 50, bgType: 'image' },
    { id: "s_numbers", type: "numbers", visible: true, order: 5, bgImageUrl: "", bgOpacity: 50, bgType: 'image' },
    { id: "s_clients", type: "clients", visible: true, order: 6, bgImageUrl: "", bgOpacity: 50, bgType: 'image' },
    { id: "s5", type: "contact", visible: true, order: 7, bgImageUrl: "", bgOpacity: 50, bgType: 'image' }
  ],
  styles: {
    fontFamily: "font-sans",
    titleSize: "text-5xl md:text-[7vw] lg:text-8xl",
    spacing: "py-16 md:py-32",
    titleAlign: "left"
  },
  outlinedWords: ["FILMS"],
  worksTitle: "Nossos Trabalhos",
  expertiseTitle: "Expertise",
  numbersTitle: "NÚMEROS\n2025",
  contactTitle: "Let's Create",
  sectionStyles: {}
};