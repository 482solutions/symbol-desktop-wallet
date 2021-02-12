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
                    Parent Namespace
                </div>
                <div class="asset-description-text">
                    Namespace info
                </div>
                <div class="asset-description-sub-title">
                    Namespace Name
                </div>
                <div class="asset-description-text">
                    Subnamespase info
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
