'use client';

import CreatorTeachingStudio from '../../../../components/CreatorTeachingStudio';
import { codieModules } from '../../../../lib/codieCurriculum';

export default function CodieTeachingStudio() {
  return (
    <CreatorTeachingStudio
      creatorSlug="codie-sanchez"
      partnerHref="/partners/codie-sanchez"
      displayName="Codie Sanchez"
      brandLabel="Contrarian Thinking"
      tutorName="Contrarian Curriculum Tutor"
      tutorVoiceId="Contrarian Curriculum Tutor"
      headline="Ask a question. Hear the answer. Apply it to a real deal."
      disclosure="This source-grounded Aridon tutor can answer follow-up questions, teach the public Contrarian Thinking curriculum, quiz the learner, take spoken questions, and explain answers through either a live D-ID digital human when configured or an animated synthetic-voice fallback. It is not Codie Sanchez. If Codie authorizes her likeness and approved voice assets, the presentation layer can be replaced without changing the curriculum and deal-analysis engine underneath."
      modules={codieModules}
      apiPath="/api/partners/codie-sanchez/teacher"
      fallbackPortrait="/executives/oracle.jpg"
      realWorldHref="/acquisitions"
      realWorldLabel="Open Buyer Room"
      realWorldPrompt="I found a business I may want to buy. Show me exactly what information I should collect before deciding whether to move it into full underwriting."
    />
  );
}
