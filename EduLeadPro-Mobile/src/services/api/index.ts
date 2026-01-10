/**
 * API Services Index
 */

import { authAPI } from './auth.api';
import { busAPI } from './bus.api';
import { teacherAPI } from './teacher.api';
import { parentAPI } from './parent.api';
import apiClient from './client';

export const api = {
    ...authAPI,
    ...busAPI,
    ...teacherAPI,
    ...parentAPI,
    client: apiClient
};

export { authAPI, busAPI, teacherAPI, parentAPI, apiClient };
export default api;
