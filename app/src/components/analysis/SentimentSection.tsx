import type { SentimentSectionProps } from './SentimentSection.client';
import SentimentSectionClient from './SentimentSection.client';

export { type SentimentSectionProps } from './SentimentSection.client';
export default function SentimentSection(props: SentimentSectionProps) {
  return <SentimentSectionClient {...props} />;
}