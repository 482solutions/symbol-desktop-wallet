<template>
    <div class="modal-metadata-update">
        <Modal v-model="show" class-name="vertical-center-modal" :footer-hide="true" :transfer="false" @on-cancel="$emit('close-modal')">
            <FormNFTMosaicSell :file-blob="fileBlob" :file-type="fileType" :mosaic-id="mosaicId" @on-confirmation-success="show = false" />
        </Modal>
    </div>
</template>
<script lang="ts">
import { ModalNFTMosaicSellTs } from './ModalNFTMosaicSellTs';
export default class ModalNFTMosaicSell extends ModalNFTMosaicSellTs {}
</script>
<style lang="less" scoped>
@import './ModalNFTMosaicSell.less';
</style>
