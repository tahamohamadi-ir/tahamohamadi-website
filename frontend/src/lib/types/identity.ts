import type { PaginatedResponse } from "./portfolio";

export interface ResearchProjectDTO {
  slug_fa: string;
  slug_en: string;
  title: string;
  summary: string;
  methodology: string;
  featured: boolean;
  published_at: string | null;
}

export interface PublicationDTO {
  slug_fa: string;
  slug_en: string;
  title: string;
  abstract: string;
  publication_type: "article" | "book" | "conference" | "report" | "manuscript";
  citation: string;
  doi: string;
  isbn: string;
  published_on: string | null;
}

export type PaginatedResearchProjectsResponse = PaginatedResponse<ResearchProjectDTO>;
export type PaginatedPublicationsResponse = PaginatedResponse<PublicationDTO>;

export interface FetchIdentityResourceParams {
  locale: "fa" | "en";
  page?: number;
  pageSize?: number;
}

export interface FetchPublicationsParams extends FetchIdentityResourceParams {
  type?: PublicationDTO["publication_type"];
  year?: string;
}

export interface PublicResumeFileDTO {
  file: string | null;
  original_filename: string;
  mime_type: string;
  file_size: number;
}

export interface ResumeVariantDTO {
  slug: string;
  label: string;
  summary: string;
  variant_type: "academic" | "industry" | "general";
  file: PublicResumeFileDTO;
}

export type PaginatedResumeVariantsResponse = PaginatedResponse<ResumeVariantDTO>;

export interface ExperienceDTO {
  organization: string;
  title: string;
  summary: string;
  started_on: string | null;
  ended_on: string | null;
}

export interface EducationDTO {
  institution: string;
  degree: string;
  field: string;
  started_on: string | null;
  ended_on: string | null;
}

/** A deliberately narrow public projection used by the site aggregate. */
export interface PublicIdentityProfileDTO {
  name: string;
  headline: string;
  bio: string;
  public_email: string;
  portrait: {
    id: string;
    file: string | null;
    original_filename: string;
    mime_type: string;
    file_size: number;
    width: number | null;
    height: number | null;
    alt_text_fa: string;
    alt_text_en: string;
    caption_fa: string;
    caption_en: string;
    status: string;
    checksum: string;
    created_at: string;
    updated_at: string;
  } | null;
}
