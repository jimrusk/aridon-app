'use client';

import CreatorTeachingStudio from '../../../../components/CreatorTeachingStudio';
import { mariaModules } from '../../../../lib/mariaWendtCurriculum';

export default function MariaWendtTeachingStudio() {
  return (
    <CreatorTeachingStudio
      creatorSlug="maria-wendt"
      partnerHref="/partners/maria-wendt"
      displayName="Maria Wendt"
      brandLabel="Maria Wendt Creator OS"
      tutorName="Maria Curriculum Tutor"
      tutorVoiceId="Maria Curriculum Tutor"
      headline="Ask the business question. Get the lesson. Turn it into an action plan."
      disclosure="This Aridon tutor is built from summarized public Maria Wendt business and marketing materials. It can answer follow-up questions, teach public frameworks, quiz learners, listen to spoken questions and speak answers through either a live D-ID digital human when configured or an animated synthetic-voice fallback. It is not Maria Wendt and does not clone her voice. If Maria authorizes her likeness, approved voice and proprietary curriculum, those assets can be connected to the same engine."
      modules={mariaModules}
      apiPath="/api/partners/maria-wendt/teacher"
      fallbackPortrait="/executives/maya.svg"
      accent="#F4B8D5"
      secondaryAccent="#B9CFFF"
      realWorldHref="/business-os/growth-command"
      realWorldLabel="Open Growth Command"
      realWorldPrompt="Apply this lesson to my business. Ask me the minimum questions you need, then give me a 7-day implementation plan with metrics I can track."
    />
  );
}
