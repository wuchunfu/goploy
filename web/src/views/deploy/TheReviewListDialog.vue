<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('review')"
    :fullscreen="$store.state.app.device === 'mobile'"
  >
    <el-table
      v-loading="tableLoading"
      border
      stripe
      highlight-current-row
      max-height="447px"
      :data="tableData"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column
        prop="projectName"
        :label="$t('projectName')"
        width="150"
      >
        <template #default>
          {{ projectRow.name }}
        </template>
      </el-table-column>
      <el-table-column
        prop="branch"
        :label="$t('branch')"
        width="150"
        align="center"
      >
        <template #default="scope">
          <el-link
            style="font-size: 12px"
            :underline="false"
            :href="gitURL + '/tree/' + scope.row.branch.split('/').pop()"
            target="_blank"
          >
            {{ scope.row.branch }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="commitId" label="commit" width="290">
        <template #default="scope">
          <el-link
            type="primary"
            style="font-size: 12px"
            :underline="false"
            :href="`${gitURL}/commit/${scope.row.commitId}`"
            target="_blank"
          >
            {{ scope.row.commitId }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="state" :label="$t('state')" width="50">
        <template #default="scope">
          {{ $t(`deployPage.reviewStateOption[${scope.row.state || 0}]`) }}
        </template>
      </el-table-column>
      <el-table-column prop="creator" :label="$t('creator')" align="center" />
      <el-table-column prop="editor" :label="$t('editor')" align="center" />
      <el-table-column
        prop="insertTime"
        :label="$t('insertTime')"
        width="135"
        align="center"
      />
      <el-table-column
        prop="updateTime"
        :label="$t('updateTime')"
        width="135"
        align="center"
      />
      <el-table-column
        prop="operation"
        :label="$t('op')"
        width="180"
        align="center"
        :fixed="$store.state.app.device === 'mobile' ? false : 'right'"
      >
        <template #default="scope">
          <el-button
            type="success"
            :disabled="scope.row.state !== 0"
            @click="handleProjectReview(scope.row, 1)"
          >
            {{ $t('approve') }}
          </el-button>
          <el-button
            type="danger"
            :disabled="scope.row.state !== 0"
            @click="handleProjectReview(scope.row, 2)"
          >
            {{ $t('deny') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      v-model:current-page="pagination.page"
      hide-on-single-page
      :total="pagination.total"
      :page-size="pagination.rows"
      style="margin-top: 10px; text-align: right"
      background
      layout="sizes, total, prev, pager, next"
      @current-change="handlePageChange"
    />
    <template #footer class="dialog-footer">
      <el-button @click="dialogVisible = false">
        {{ $t('cancel') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { DeployReview } from '@/api/deploy'
import { ProjectReviewList } from '@/api/project'
import { role } from '@/utils/namespace'
import { parseGitURL, parseTime } from '@/utils'
import { ElMessageBox, ElMessage } from 'element-plus'
import { computed, watch, defineComponent, ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    projectRow: {
      type: Object,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (val) => {
        emit('update:modelValue', val)
      },
    })
    const gitURL = ref<string>('')
    const pagination = reactive({ page: 1, rows: 11, total: 0 })
    const tableData = ref<ProjectReviewList['datagram']['list']>([])
    watch(
      () => props.modelValue,
      (val: typeof props['modelValue']) => {
        if (val === true) {
          gitURL.value = parseGitURL(props.projectRow.url)
          handlePageChange()
        }
      }
    )

    const tableLoading = ref(false)
    const getReviewList = () => {
      tableLoading.value = true
      new ProjectReviewList({ id: props.projectRow.id }, pagination)
        .request()
        .then((response) => {
          tableData.value = response.data.list
          pagination.total = response.data.pagination.total
        })
        .finally(() => {
          tableLoading.value = false
        })
    }

    const handlePageChange = (page = 1) => {
      pagination.page = page
      getReviewList()
    }

    const handleProjectReview = (data: { id: number }, state: number) => {
      if (state === 1) {
        ElMessageBox.confirm(t('deployPage.reviewTips'), t('tips'), {
          confirmButtonText: t('confirm'),
          cancelButtonText: t('cancel'),
          type: 'warning',
        })
          .then(() => {
            new DeployReview({ projectReviewId: data.id, state })
              .request()
              .then(() => {
                dialogVisible.value = false
              })
          })
          .catch(() => {
            ElMessage.info('Cancel')
          })
      } else {
        new DeployReview({ projectReviewId: data.id, state })
          .request()
          .then(() => {
            dialogVisible.value = false
          })
      }
    }

    return {
      dialogVisible,
      role,
      gitURL,
      parseTime,
      pagination,
      tableLoading,
      tableData,
      getReviewList,
      handlePageChange,
      handleProjectReview,
    }
  },
})
</script>
