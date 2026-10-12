import { computed, onMounted, ref } from 'vue';
import type { CredentialVO } from '@/api/quant/types';
import { listCredential } from '@/api/quant';

export const useCredentialOptions = () => {
  const credentials = ref<CredentialVO[]>([]);
  const credentialOptions = computed(() =>
    credentials.value.map(credential => ({
      label: `${credential.accountName}（${credential.userName || credential.userId}）`,
      value: String(credential.id)
    }))
  );
  const credentialFilter = computed(() => ({
    key: 'credentialId',
    label: '凭证用户',
    type: 'select' as const,
    placeholder: '请选择凭证用户',
    options: credentialOptions.value
  }));
  const accountName = (id: unknown) =>
    credentials.value.find(credential => String(credential.id) === String(id))?.accountName || '未知账户';
  onMounted(async () => {
    const rows: CredentialVO[] = [];
    let pageNum = 1;
    let total = 0;
    do {
      const result = await listCredential({ pageNum, pageSize: 100 });
      const page = result.data?.rows || [];
      rows.push(...page);
      total = result.data?.total || 0;
      pageNum++;
      if (!page.length) break;
    } while (rows.length < total);
    credentials.value = rows;
  });
  return { credentialFilter, accountName };
};
