<template>
    <div class="FormTransferToken">
        <FormWrapper>
            <ValidationObserver v-slot="{ handleSubmit }" ref="observer" slim>
                <form onsubmit="event.preventDefault()">
                    <div class="create-nft-mosaic-form">
                        <div class="create-nft-mosaic-left">
                            <div v-if="showTransactionActions" class="transfer-actions">
                                <a @click="isImportTransactionUriModalVisible = true">
                                    <!--<Icon type="md-arrow-round-down" />-->{{ $t('import_transaction_uri') }}
                                </a>
                            </div>

                            <!-- Transaction signer selector -->
                            <SignerSelector
                                v-if="!hideSigner"
                                v-model="formItems.signerAddress"
                                :signers="signers"
                                @input="onChangeSigner"
                            />

                            <!-- Transfer recipient input field -->
                            <RecipientInput v-model="formItems.recipientRaw" @input="onChangeRecipient" />

                            <!-- Transfer message input field -->
                            <MessageInput v-model="formItems.messagePlain" @input="onChangeMessage" />
                            <FormRow v-if="!selectedSigner.multisig && !isAggregate && !isLedger">
                                <template v-slot:inputs>
                                    <div class="inputs-container checkboxes">
                                        <Checkbox v-model="formItems.encryptMessage" @input="onEncryptionChange">
                                            {{ $t('encrypt_message') }}
                                        </Checkbox>
                                    </div>
                                </template>
                            </FormRow>

                            <!-- Submit button -->
                            <MaxFeeAndSubmitToken
                                v-if="!isAggregate"
                                v-model="formItems.maxFee"
                                :hide-submit="hideSubmit"
                                :calculated-recommended-fee="calculatedRecommendedFee"
                                :calculated-highest-fee="calculatedHighestFee"
                                @input="onChangeMaxFee"
                                @button-clicked="handleSubmit(onSubmit)"
                            />

                            <div v-else-if="!hideSave" class="ml-2" style="text-align: right;">
                                <button
                                    type="submit"
                                    class="save-button centered-button button-style inverted-button"
                                    @click="emitToAggregate"
                                >
                                    {{ $t('save') }}
                                </button>
                            </div>

                            <!-- Transaction URI display-->
                            <FormRow v-if="transactions && transactions.length > 0" class="transaction-uri-display-row">
                                <template v-slot:inputs>
                                    <TransactionUriDisplay :transaction="transactions[0]" />
                                </template>
                            </FormRow>
                        </div>
                        <div class="token-preview">
                            <img
                                v-if="type && type.indexOf('image') !== -1"
                                :src="src"
                                :alt="title"
                                :title="title"
                                style="max-width: 350px;"
                            />
                            <video
                                v-else-if="type && type.indexOf('video') !== -1"
                                autoplay
                                muted
                                loop
                                :src="src"
                                class="card-image"
                                :type="type"
                                style="max-width: 315px;"
                            />
                        </div>
                    </div>
                </form>
            </ValidationObserver>

            <ModalTransactionConfirmation
                v-if="hasConfirmationModal"
                :command="command"
                :visible="hasConfirmationModal"
                @success="onConfirmationSuccess"
                @error="onConfirmationError"
                @close="onConfirmationCancel"
            />

            <ModalTransactionUriImport
                v-if="isImportTransactionUriModalVisible"
                :visible="isImportTransactionUriModalVisible"
                @close="onImportTransactionURIModalClose"
                @importTransaction="onImportTransaction"
            />

            <ModalFormProfileUnlock
                v-if="hasAccountUnlockModal"
                :visible="hasAccountUnlockModal"
                :on-success="onAccountUnlocked"
                @close="closeAccountUnlockModal"
            />
        </FormWrapper>
    </div>
</template>

<script lang="ts">
import { FormTransferTransactionTs } from './FormTransferTokenTs';
export default class FormTransferTransaction extends FormTransferTransactionTs {}
</script>

<style lang="less" scoped>
.save-button {
    text-align: center;
    width: 120px;
}
.create-nft-mosaic-form {
    display: flex;
}
.create-nft-mosaic-left {
    display: flex;
    flex-direction: column;
    width: 100%;
}
</style>
