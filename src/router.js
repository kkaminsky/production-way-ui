import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

import UserCabinet from './views/UserCabinet.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      meta:{requiresAuth:false}
    },
    {
      path: '/usercabinet',
      name: 'usercabinet',
      component: UserCabinet,
      meta:{requiresAuth:false}

    }
  ]
})
