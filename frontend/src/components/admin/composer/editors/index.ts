import type { BlockType } from "../types";
import {
    HeroEditor,
    TextEditor,
    GalleryEditor,
    CtaEditor,
    CollectionEditor,
    QuoteEditor,
    DividerEditor,
    ResearchFocusEditor,
} from "./content-editors";
import {
    ScrollRevealEditor,
    ParallaxEditor,
    TextStaggerEditor,
    FadeInSequenceEditor,
    HoverCardEditor,
    CounterAnimationEditor,
    ImageRevealEditor,
    SectionTransitionEditor,
} from "./animation-editors";

export const BLOCK_EDITORS = {
    hero: HeroEditor,
    text: TextEditor,
    gallery: GalleryEditor,
    cta: CtaEditor,
    collection: CollectionEditor,
    quote: QuoteEditor,
    divider: DividerEditor,
    research_focus: ResearchFocusEditor,
    scroll_reveal: ScrollRevealEditor,
    parallax: ParallaxEditor,
    text_stagger: TextStaggerEditor,
    fade_in_sequence: FadeInSequenceEditor,
    hover_card: HoverCardEditor,
    counter_animation: CounterAnimationEditor,
    image_reveal: ImageRevealEditor,
    section_transition: SectionTransitionEditor,
} as unknown as Record<
    BlockType,
    React.ComponentType<{ settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }>
>;

export { FieldErrorsContext } from "./shared";
