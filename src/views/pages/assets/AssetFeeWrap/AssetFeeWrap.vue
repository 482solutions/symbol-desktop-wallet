<template>
    <div class="asset-form-main-container">
        <div class="form-section">
            <slot name="form-section" />
        </div>
        <Icon type="ios-help-circle-outline" size="20" @click="hasHelpModal = true" />
        <div class="container">
            <Modal v-model="hasHelpModal" :transfer="false" :title="$t('rules_describe')">
                <div class="asset-description-sub-title">
                    By Account
                </div>
                <div class="asset-description-text">
                    The account from which the token will be created. Will own the token by default
                </div>
                <div class="asset-description-sub-title">
                    NFT Root Namespace
                </div>
                <div class="asset-description-text">
                    The root namespace for new NFT Mosaic. You can create new root namespace in
                    <span style="color: #44004e; cursor: pointer;" @click="$router.push({ name: 'namespaces.createRootNamespace' })">
                        Create root namespace
                    </span>
                </div>
                <div class="asset-description-sub-title">
                    NFT Title
                </div>
                <div class="asset-description-text">
                    The name of your custom nft token. Can contain up to 40 characters
                </div>
                <div class="asset-description-sub-title">
                    NFT Description
                </div>
                <div class="asset-description-text">
                    Description of your token, can contain up to 100 characters
                </div>
                <div class="asset-description-sub-title">
                    Service Fee
                </div>
                <div class="asset-description-text">
                    The commission for the maintenance of the token storage is calculated according to the formula 10 * Fee
                </div>
                <div slot="footer" class="modal-footer"></div>
            </Modal>
        </div>
    </div>
</template>

<script lang="ts">
import { AssetFeeWrapTs } from './AssetFeeWrapTs';
export default class AssetFormPageWrap extends AssetFeeWrapTs {}
</script>

<style lang="less" scoped>
@import './AssetFeeWrap.less';
</style>
