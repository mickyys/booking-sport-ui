import { readFileSync } from 'fs';
import { join } from 'path';
import { LegalPage } from '@/components/legal/LegalPage';
import { parseMarkdown } from '@/lib/markdown';

export const metadata = {
  title: 'Términos y Política de Privacidad | ReservaloYA',
  description: 'Política de Privacidad de ReservaloYA.',
};

export default function TermsPage() {
  const md = readFileSync(join(process.cwd(), 'content', 'terms.md'), 'utf8');
  return <LegalPage blocks={parseMarkdown(md)} />;
}
