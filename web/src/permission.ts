import router from './router'
import store from './store'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { isLogin, logout } from '@/utils/auth' // get token from cookie
import { RouteRecordRaw } from 'vue-router'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login'] // no redirect whitelist

router.beforeEach(async (to) => {
  // start progress bar
  NProgress.start()
  // set page title
  document.title = 'Goploy'
  // determine whether the user has logged in
  if (isLogin()) {
    if (to.path === '/login') {
      // if is logged in, redirect to the home page
      NProgress.done()
      return '/'
    } else {
      // determine whether the user has obtained his permission roles through getInfo
      const hasUID = store.state.user.id && store.state.user.id !== 0
      if (hasUID) {
        return true
      } else {
        try {
          // get user info
          // note: roles must be a object array! such as: ['admin'] or ,['developer','editor']
          await store.dispatch('user/getInfo')
          // generate accessible routes map based on roles
          const accessRoutes = await store.dispatch('permission/generateRoutes')

          // dynamically add accessible routes
          accessRoutes.forEach((route: RouteRecordRaw) =>
            router.addRoute(route)
          )
          // hack method to ensure that addRoutes is complete
          // set the replace: true, so the navigation will not leave a history record
          return { ...to, replace: true }
        } catch (error) {
          // remove token and go to login page to re-login
          logout()
          ElMessage.error(error || 'Has Error')
          NProgress.done()
          return `/login?redirect=${to.path}`
        }
      }
    }
  } else {
    /* has no token*/
    if (whiteList.indexOf(to.path) !== -1) {
      // in the free login whitelist, go directly
      return true
    } else {
      // other pages that do not have permission to access are redirected to the login page.
      NProgress.done()
      return `/login?redirect=${to.path}`
    }
  }
})

router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})
