'use client';

import CreatorTeachingStudio from '../../../../components/CreatorTeachingStudio';
import { cnmModules } from '../../../../lib/cnmIngenuityCurriculum';

export default function CnmIngenuityTeachingStudio() {
  return (
    <CreatorTeachingStudio
      creatorSlug="cnm-ingenuity"
      partnerHref="/partners/cnm-ingenuity"
      displayName="CNM Ingenuity"
      brandLabel="Future Skills AI Teacher"
      tutorName="Future Skills Guide"
      tutorVoiceId="Future Skills Guide"
      headline="Try the skill before you choose the program."
      disclosure="This Aridon prototype turns public CNM Ingenuity program descriptions into short, interactive sample lessons for prospective learners. Pick a topic, ask questions by voice or text, practice a concept and get a quick knowledge check. It is a proposed partnership demo, not an official CNM Ingenuity course, instructor, assessment or endorsement."
      modules={cnmModules}
      apiPath="/api/partners/cnm-ingenuity/teacher"
      fallbackPortrait="/executives/maya.svg"
      accent="#20A6D8"
      secondaryAccent="#8FE6C4"
      realWorldHref="/partners/cnm-ingenuity"
      realWorldLabel="Back to CNM Demo"
      realWorldPrompt="Help me choose which sample lesson to try based on my interests, current experience and the kind of work I want to do. Ask me only three questions, then recommend one lesson and explain why."
    />
  );
}
