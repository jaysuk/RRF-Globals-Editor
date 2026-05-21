import { registerRoute } from '@/routes';
import GlobalsManager from './GlobalsManager.vue';

registerRoute(GlobalsManager, {
    Plugins: {
        GlobalsManager: {
            icon: 'mdi-variable',
            caption: 'Globals Editor',
            path: '/Plugins/GlobalsManager',
            translated: true
        }
    }
});
