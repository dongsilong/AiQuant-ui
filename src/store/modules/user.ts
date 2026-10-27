import { to } from 'await-to-js';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfo } from '@/api/system/user/types';
import type { LoginData, LoginResult } from '@/api/types';
import type { RuoYiAjaxResult } from '@/utils/api-types';
import { getInfo as getUserInfo, login as loginApi, logout as logoutApi } from '@/api/login';
import defAva from '@/assets/images/profile.jpg';
import { getToken, removeToken, setToken } from '@/utils/auth';

export const useUserStore = defineStore('user', () => {
  const token = ref(getToken());
  const name = ref('');
  const nickname = ref('');
  const userId = ref<string | number>('');
  const avatar = ref('');
  const roles = ref<Array<string>>([]); // 用户角色编码集合 → 判断路由权限
  const permissions = ref<Array<string>>([]); // 用户权限编码集合 → 判断按钮权限

  /**
   * 登录
   * @param userInfo
   * @returns
   */
  const login = async (userInfo: LoginData): Promise<void> => {
    const [err, res] = await to(loginApi(userInfo));
    if (res) {
      const data = (res as RuoYiAjaxResult<LoginResult>).data;
      if (!data?.access_token) {
        return Promise.reject(err);
      }
      // 新会话建立时先清除旧会话的授权快照，避免账号切换期间沿用旧权限。
      roles.value = [];
      permissions.value = [];
      setToken(data.access_token);
      token.value = data.access_token;
      return Promise.resolve();
    }
    return Promise.reject(err);
  };

  // 获取用户信息
  const getInfo = async (): Promise<void> => {
    const [err, res] = await to(getUserInfo());
    if (res) {
      const data = (res as RuoYiAjaxResult<UserInfo>).data;
      if (!data?.user) {
        return Promise.reject(err);
      }
      const user = data.user;
      const profile = user.avatarUrl == '' || user.avatarUrl == null ? defAva : user.avatarUrl;

      // 每次都覆盖两类授权快照；空值按无权限处理，绝不保留上一次请求的数据。
      roles.value = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : ['ROLE_DEFAULT'];
      permissions.value = Array.isArray(data.permissions) ? data.permissions : [];
      name.value = user.userName;
      nickname.value = user.nickName;
      avatar.value = profile;
      userId.value = user.userId;
      return Promise.resolve();
    }
    return Promise.reject(err);
  };

  // 注销
  const logout = async (): Promise<void> => {
    try {
      await logoutApi();
    } finally {
      token.value = '';
      roles.value = [];
      permissions.value = [];
      name.value = '';
      nickname.value = '';
      userId.value = '';
      avatar.value = '';
      removeToken();
    }
  };

  const setAvatar = (value: string) => {
    avatar.value = value;
  };

  return {
    userId,
    token,
    nickname,
    avatar,
    roles,
    permissions,
    login,
    getInfo,
    logout,
    setAvatar
  };
});
