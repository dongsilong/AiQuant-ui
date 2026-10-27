import type { Directive, DirectiveBinding } from 'vue';
import { useUserStore } from '@/store/modules/user';

const originalDisplay = new WeakMap<HTMLElement, string>();

const isValidPermissionList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string');

const applyPermission = (el: HTMLElement, binding: DirectiveBinding) => {
  if (!isValidPermissionList(binding.value)) {
    throw new Error("check perms! Like v-has-permi=\"['system:user:add','system:user:edit']\"");
  }
  if (!originalDisplay.has(el)) originalDisplay.set(el, el.style.display);
  const { permissions } = useUserStore();
  const allowed = permissions.some((permission: string) => permission === '*:*:*' || binding.value.includes(permission));
  el.style.display = allowed ? (originalDisplay.get(el) ?? '') : 'none';
};

const applyRole = (el: HTMLElement, binding: DirectiveBinding) => {
  if (!isValidPermissionList(binding.value)) {
    throw new Error("check roles! Like v-has-roles=\"['admin','test']\"");
  }
  if (!originalDisplay.has(el)) originalDisplay.set(el, el.style.display);
  const { roles } = useUserStore();
  const allowed = roles.some((role: string) => role === 'superadmin' || role === 'admin' || binding.value.includes(role));
  el.style.display = allowed ? (originalDisplay.get(el) ?? '') : 'none';
};

/**
 * 按钮权限指令。后端接口仍必须独立执行授权校验；此指令仅控制界面展示。
 * updated 钩子用于在绑定值变化时重新计算，避免只在首次挂载时校验。
 */
export const hasPermi: Directive = {
  mounted: applyPermission,
  updated: applyPermission
};

/** 角色展示指令；不替代服务端权限检查。 */
export const hasRoles: Directive = {
  mounted: applyRole,
  updated: applyRole
};
