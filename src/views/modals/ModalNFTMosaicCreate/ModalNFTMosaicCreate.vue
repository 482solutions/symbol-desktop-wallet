<template>
    <div class="modal-metadata-update">
        <Modal v-model="show" class-name="vertical-center-modal" :footer-hide="true" :transfer="false" @on-cancel="$emit('close-modal')">
            <FormNFTMosaicCreation @on-confirmation-success="show = false" />
        </Modal>
    </div>
</template>
<script lang="ts">
import { ModalNFTMosaicCreateTs } from './ModalNFTMosaicCreateTs';
export default class ModalNFTMosaicCreate extends ModalNFTMosaicCreateTs {}
</script>
<style lang="less" scoped>
@import './ModalNFTMosaicCreate.less';
</style>
