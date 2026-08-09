export interface PublicSiteSettingsDTO {
  site_title: string;
  default_title: string;
  default_description: string;
  public_email: string;
  primary_cta_label: string;
  primary_cta_url: string;
  footer_text: string;
  theme_preset: string;
  density: string;
  design_tokens: Record<string, unknown>;
}

export interface PublicNavigationItemDTO {
  label: string;
  href: string;
}

export interface PublicSiteConfigDTO {
  settings: PublicSiteSettingsDTO | null;
  navigation: {
    header: PublicNavigationItemDTO[];
    footer: PublicNavigationItemDTO[];
  };
}

export interface PublicSiteAggregateDTO {
  site: PublicSiteConfigDTO;
  identity: {
    profile: import("./identity").PublicIdentityProfileDTO | null;
    experience: import("./identity").ExperienceDTO[];
    education: import("./identity").EducationDTO[];
  };
}
