import type { ExecutionProject } from './execution';
import { PADUCAH_GRIDCORE_TEST_PROJECT } from './doeTestPaducah';
import { LOS_ALAMOS_RESILIENCE_TEST_PROJECT } from './doeTestLosAlamos';
import { GENESIS_INTELLIGENCE_TEST_PROJECT } from './doeTestGenesis';

export const DOE_TEST_PROJECTS: ExecutionProject[] = [
  PADUCAH_GRIDCORE_TEST_PROJECT,
  LOS_ALAMOS_RESILIENCE_TEST_PROJECT,
  GENESIS_INTELLIGENCE_TEST_PROJECT,
];

export function scoreDoeTestProjects(projects: ExecutionProject[] = DOE_TEST_PROJECTS) {
  const projectsScore = projects.map((project) => {
    const checks = {
      summary: project.executiveSummary.length >= 180,
      definitionOfDone: project.definitionOfDone.length >= 6,
      fullTeam: project.agents.length >= 7,
      deliverablesPresent: project.deliverables.length >= 4,
      substantiveContent: project.deliverables.every((item) => item.content.length >= 900),
      qualityChecks: project.deliverables.every((item) => item.qualityChecks.length >= 3),
      approvalGates: project.deliverables.some((item) => item.approvalRequired),
      finalChecks: project.finalChecks.length >= 5,
      reviewableStatus: project.status === 'ready_for_approval' || project.status === 'complete',
    };

    return {
      id: project.id,
      title: project.title,
      passed: Object.values(checks).every(Boolean),
      checks,
      deliverableCount: project.deliverables.length,
      totalCharacters: project.deliverables.reduce((total, item) => total + item.content.length, 0),
    };
  });

  return {
    passed: projectsScore.every((project) => project.passed),
    projectCount: projectsScore.length,
    projects: projectsScore,
  };
}
