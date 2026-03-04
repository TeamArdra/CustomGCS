import { useCallback } from 'react';
import { useMissionStore } from '../store';
import { missionService } from '../services/api';
import { useAlertStore } from '../store/alertStore';

export const useMission = () => {
  const missionStore = useMissionStore();
  const { addAlert } = useAlertStore();

  const loadMissions = useCallback(async () => {
    try {
      const missions = await missionService.getMissions();
      missionStore.missions.forEach((m) => missionStore.deleteMission(m.id));
      missions.forEach((m) => missionStore.addMission(m));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load missions';
      addAlert({
        type: 'error',
        title: 'Error',
        message,
        dismissible: true,
      });
    }
  }, [missionStore, addAlert]);

  const saveMission = useCallback(
    async (mission: Parameters<typeof missionService.createMission>[0]) => {
      try {
        const created = await missionService.createMission(mission);
        missionStore.addMission(created);
        addAlert({
          type: 'success',
          title: 'Success',
          message: 'Mission saved successfully',
          dismissible: true,
        });
        return created;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save mission';
        addAlert({
          type: 'error',
          title: 'Error',
          message,
          dismissible: true,
        });
        throw error;
      }
    },
    [missionStore, addAlert]
  );

  return {
    ...missionStore,
    loadMissions,
    saveMission,
  };
};
