<template>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('manage')"
    :close-on-click-modal="false"
    :fullscreen="$store.state.app.device === 'mobile'"
  >
    <el-row class="app-bar" type="flex" justify="end">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd" />
      <el-row
        v-if="showAddView"
        type="flex"
        justify="center"
        style="margin-top: 10px; width: 100%"
      >
        <el-form ref="form" :inline="true" :rules="formRules" :model="formData">
          <el-form-item
            :label="$t('server')"
            label-width="120px"
            prop="serverIds"
          >
            <el-select v-model="formData.serverIds" multiple>
              <el-option
                v-for="(item, index) in serverOption"
                :key="index"
                :label="item.label"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item style="margin-right: 0px; margin-bottom: 5px">
            <el-button
              type="primary"
              :disabled="formProps.disabled"
              @click="add"
            >
              {{ $t('confirm') }}
            </el-button>
            <el-button @click="showAddView = false">
              {{ $t('cancel') }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-row>
    </el-row>
    <el-table
      v-loading="tableLoading"
      border
      stripe
      highlight-current-row
      :data="tableData"
      style="width: 100%"
    >
      <el-table-column prop="serverId" :label="$t('serverId')" width="100" />
      <el-table-column
        prop="serverName"
        :label="$t('serverName')"
        width="120"
      />
      <el-table-column
        prop="serverDescription"
        :label="$t('serverDescription')"
        min-width="200"
        show-overflow-tooltip
      />
      <el-table-column
        prop="insertTime"
        :label="$t('insertTime')"
        width="160"
        align="center"
      />
      <el-table-column
        prop="updateTime"
        :label="$t('updateTime')"
        width="160"
        align="center"
      />
      <el-table-column
        prop="operation"
        :label="$t('op')"
        width="80"
        align="center"
      >
        <template #default="scope">
          <el-button
            type="danger"
            icon="el-icon-delete"
            @click="remove(scope.row)"
          />
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <el-button @click="dialogVisible = false">
        {{ $t('cancel') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import {
  ProjectServerData,
  ProjectServerList,
  ProjectServerAdd,
  ProjectServerRemove,
} from '@/api/project'
import { ServerOption } from '@/api/server'
import Validator from 'async-validator'
import { ElMessageBox, ElMessage } from 'element-plus'
import { computed, watch, defineComponent, ref, Ref } from 'vue'

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    projectId: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const tableData: Ref<ProjectServerList['datagram']['list']> = ref([])
    const dialogVisible = computed({
      get: () => props.modelValue,
      set: (val) => {
        emit('update:modelValue', val)
      },
    })
    const tableLoading = ref(false)
    const getBindServerList = (projectId: number) => {
      tableLoading.value = true
      new ProjectServerList({ id: projectId })
        .request()
        .then((response) => {
          tableData.value = response.data.list
        })
        .finally(() => {
          tableLoading.value = false
        })
    }

    watch(
      () => props.modelValue,
      (val: typeof props['modelValue']) => {
        if (val === true) {
          getBindServerList(props.projectId)
        }
      }
    )

    const showAddView = ref(false)
    const handleAdd = () => {
      showAddView.value = true
    }
    const serverOption: Ref<ServerOption['datagram']['list']> = ref([])
    watch(showAddView, (val: boolean) => {
      if (val === true) {
        new ServerOption().request().then((response) => {
          serverOption.value = response.data.list
        })
      }
    })

    return {
      dialogVisible,
      getBindServerList,
      tableLoading,
      tableData,
      showAddView,
      handleAdd,
      serverOption,
    }
  },
  data() {
    return {
      formProps: {
        disabled: false,
      },
      formData: {
        projectId: 0,
        serverIds: [],
      },
      formRules: {
        serverIds: [
          {
            type: 'array',
            required: true,
            message: 'Server required',
            trigger: 'change',
          },
        ],
      },
    }
  },
  watch: {
    projectId: function (newVal) {
      this.formData.projectId = newVal
    },
  },
  methods: {
    add() {
      ;(this.$refs.form as Validator).validate((valid: boolean) => {
        if (valid) {
          this.formProps.disabled = true
          new ProjectServerAdd(this.formData)
            .request()
            .then(() => {
              ElMessage.success('Success')
              this.getBindServerList(this.formData.projectId)
            })
            .finally(() => {
              this.formProps.disabled = false
            })
        } else {
          return false
        }
      })
    },

    remove(data: ProjectServerData['datagram']['detail']) {
      ElMessageBox.confirm(
        this.$t('crontabPage.removeCrontabServerTips'),
        this.$t('tips'),
        {
          confirmButtonText: this.$t('confirm'),
          cancelButtonText: this.$t('cancel'),
          type: 'warning',
        }
      )
        .then(() => {
          new ProjectServerRemove({
            projectServerId: data.id,
          })
            .request()
            .then(() => {
              ElMessage.success('Success')
              this.getBindServerList(data.projectId)
            })
        })
        .catch(() => {
          ElMessage.info('Cancel')
        })
    },
  },
})
</script>
