/*
 * Copyright 2020-present NEM (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
import {
    Address,
    EncryptedMessage,
    Message,
    Mosaic,
    MosaicId,
    NamespaceId,
    PlainMessage,
    Transaction,
    TransferTransaction,
    UInt64,
    Account,
    PublicAccount,
} from 'symbol-sdk';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { mapGetters } from 'vuex';
// internal dependencies
import { AccountType } from '@/core/database/entities/AccountModel';
import { Formatters } from '@/core/utils/Formatters';
import { FormTransactionBase } from '@/views/forms/FormTransactionBase/FormTransactionBase';
import { AddressValidator, AliasValidator } from '@/core/validation/validators';
// child components
import { ValidationObserver } from 'vee-validate';
// @ts-ignore
import AmountInput from '@/components/AmountInput/AmountInput.vue';
// @ts-ignore
import FormWrapper from '@/components/FormWrapper/FormWrapper.vue';
// @ts-ignore
import MessageInput from '@/components/MessageInput/MessageInput.vue';
// @ts-ignore
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';
// @ts-ignore
import MosaicAttachmentInput from '@/components/MosaicAttachmentInput/MosaicAttachmentInput.vue';
// @ts-ignore
import MosaicSelector from '@/components/MosaicSelector/MosaicSelector.vue';
// @ts-ignore
import RecipientInput from '@/components/RecipientInput/RecipientInput.vue';
// @ts-ignore
import SignerSelector from '@/components/SignerSelector/SignerSelector.vue';
// @ts-ignore
import MaxFeeAndSubmitToken from '@/components/MaxFeeAndSubmitToken/MaxFeeAndSubmitToken.vue';
// @ts-ignore
import ModalTransactionUriImport from '@/views/modals/ModalTransactionUriImport/ModalTransactionUriImport.vue';
// @ts-ignore
import TransactionUriDisplay from '@/components/TransactionUri/TransactionUriDisplay/TransactionUriDisplay.vue';
// @ts-ignore
import ProtectedPrivateKeyDisplay from '@/components/ProtectedPrivateKeyDisplay/ProtectedPrivateKeyDisplay.vue';
// @ts-ignore
import ModalFormProfileUnlock from '@/views/modals/ModalFormProfileUnlock/ModalFormProfileUnlock.vue';

// @ts-ignore
import FormRow from '@/components/FormRow/FormRow.vue';
import { FilterHelpers } from '@/core/utils/FilterHelpers';
import { TransactionCommand } from '@/services/TransactionCommand';
import { feesConfig } from '@/config';
import { NotificationType } from '@/core/utils/NotificationType';

@Component({
    components: {
        AmountInput,
        FormWrapper,
        MessageInput,
        ModalTransactionConfirmation,
        MosaicAttachmentInput,
        MosaicSelector,
        RecipientInput,
        SignerSelector,
        ValidationObserver,
        MaxFeeAndSubmitToken,
        FormRow,
        ModalTransactionUriImport,
        TransactionUriDisplay,
        ProtectedPrivateKeyDisplay,
        ModalFormProfileUnlock,
    },
    computed: {
        ...mapGetters({
            currentHeight: 'network/currentHeight',
            balanceMosaics: 'mosaic/balanceMosaics',
            currentRecipient: 'account/currentRecipient',
        }),
    },
})
export class FormTransferTransactionTs extends FormTransactionBase {
    @Prop({
        default: null,
    })
    recipient: Address;

    @Prop({
        default: null,
    })
    message: Message;

    @Prop({
        default: false,
    })
    hideSubmit: boolean;

    @Prop({
        default: false,
    })
    hideSave: boolean;

    @Prop({
        default: false,
    })
    hideSigner: boolean;

    @Prop({
        default: false,
    })
    showTransactionActions: boolean;

    @Prop({
        default: () => ({}),
    })
    value: any;

    @Prop({
        default: '',
    })
    title: string;

    @Prop({
        default: false,
    })
    isAggregate: boolean;

    @Prop({
        required: true,
    })
    readonly mosaicId: string;

    @Prop({
        required: true,
    })
    readonly type: string;

    @Prop({
        required: true,
    })
    readonly src: string;

    inputMosaicIdHex: string = this.mosaicId;
    /// end-region component properties

    /**
     * Formatters helpers
     * @var {Formatters}
     */
    public formatters = Formatters;

    /**
     * Form items
     * @var {any}
     */
    public formItems = {
        signerAddress: '',
        recipientRaw: '',
        recipient: null,
        selectedMosaicHex: '',
        relativeAmount: 0,
        messagePlain: '',
        encryptMessage: false,
        maxFee: 0,
        signerPublicKey: '',
    };

    public currentHeight: number;

    private isMounted: boolean = false;

    /**
     * Whether ModalTransactionUriImport is visible
     */
    private isImportTransactionUriModalVisible = false;

    /**
     * Transaction imported via transaction URI
     */
    private importedTransaction: Transaction;

    /**
     * Holds the just in time transactions
     */
    public transactions: TransferTransaction[] = [];

    /**
     * Calculated recommended fee based on the txs size
     */
    private calculatedRecommendedFee: number = 0;

    /**
     * Calculated highest fee based on the txs size
     */
    private calculatedHighestFee: number = 0;

    /**
     * Current recipient account info
     */
    private currentRecipient: PublicAccount;

    private encyptedMessage: Message;

    private showUnlockAccountModal = false;

    /**
     * Reset the form with properties
     * @return {void}
     */
    protected resetForm() {
        // - set default form values
        if (this.isAggregate) {
            if (this.isMounted) {
                this.formItems.signerAddress = this.selectedSigner ? this.selectedSigner.address.plain() : this.currentAccount.address;
            }
        } else {
            this.formItems.signerAddress = this.selectedSigner ? this.selectedSigner.address.plain() : this.currentAccount.address;
        }

        this.formItems.selectedMosaicHex = this.networkMosaic.toHex();
        // default currentAccount Address to recipientRaw
        if (this.$route.path.indexOf('invoice') > -1) {
            this.formItems.recipientRaw = this.currentAccount.address || '';
            this.onChangeRecipient();
        } else {
            this.formItems.recipientRaw = !!this.recipient ? this.recipient.plain() : '';
        }
        this.formItems.recipient = !!this.recipient ? this.recipient : null;

        this.formItems.messagePlain = this.message ? Formatters.hexToUtf8(this.message.payload) : '';
        this.formItems.encryptMessage = false;
        this.encyptedMessage = null;
        this.showUnlockAccountModal = false;
        // - maxFee must be absolute
        this.formItems.maxFee = this.defaultFee;

        // transaction details passed via router
        if (this.$route.params.transaction || this.importedTransaction) {
            // @ts-ignore
            this.setTransactions([!!this.importedTransaction ? this.importedTransaction : this.$route.params.transaction]);
            this.onChangeRecipient();
        }
        this.triggerChange();
    }

    /**
     * Getter for TRANSFER transactions that will be staged
     * @see {FormTransactionBase}
     * @return {TransferTransaction[]}
     */
    protected getTransactions(): TransferTransaction[] {
        // const mosaicsInfo = this.$store.getters['mosaic/mosaics'] as MosaicModel[];
        const mosaicId = new MosaicId(this.mosaicId);
        return [
            TransferTransaction.create(
                this.createDeadline(),
                this.instantiatedRecipient,
                [new Mosaic(mosaicId, UInt64.fromUint(1))],
                this.formItems.encryptMessage ? this.encyptedMessage : PlainMessage.create(this.formItems.messagePlain || ''),
                this.networkType,
                UInt64.fromUint(this.formItems.maxFee),
            ),
        ];
    }

    /**
     * Setter for TRANSFER transactions that will be staged
     * @see {FormTransactionBase}
     * @param {TransferTransaction[]} transactions
     * @throws {Error} If not overloaded in derivate component
     */
    protected setTransactions(transactions: TransferTransaction[]) {
        // - this form creates only 1 transaction
        const transaction = transactions.shift();

        // - populate recipient
        this.formItems.recipientRaw =
            transaction.recipientAddress instanceof NamespaceId
                ? transaction.recipientAddress.fullName
                : transaction.recipientAddress.plain();

        // - populate message
        this.formItems.messagePlain = transaction.message.payload;

        // - populate maxFee
        this.formItems.maxFee = transaction.maxFee.compact();
    }

    /// region computed properties getter/setter
    /**
     * Recipient used in the transaction
     * @readonly
     * @protected
     * @type {(Address | NamespaceId)}
     */
    protected get instantiatedRecipient(): Address | NamespaceId {
        const { recipientRaw } = this.formItems;
        if (AddressValidator.validate(recipientRaw)) {
            return Address.createFromRawAddress(recipientRaw);
        } else if (AliasValidator.validate(recipientRaw)) {
            return new NamespaceId(recipientRaw);
        } else {
            return null;
        }
    }

    protected get isLedger(): boolean {
        return this.currentAccount.type == AccountType.LEDGER;
    }

    protected get hasAccountUnlockModal(): boolean {
        return this.showUnlockAccountModal;
    }

    protected set hasAccountUnlockModal(f: boolean) {
        this.showUnlockAccountModal = f;
    }

    /**
     * Handler when changing message
     */
    onChangeMessage() {
        this.triggerChange();
    }

    /**
     * Handler when changing recipient
     */
    onChangeRecipient() {
        // filter tags
        this.formItems.recipientRaw = FilterHelpers.stripFilter(this.formItems.recipientRaw);
        if (Address.isValidRawAddress(this.formItems.recipientRaw)) {
            this.$store.dispatch('account/GET_RECIPIENT', Address.createFromRawAddress(this.formItems.recipientRaw)).then(() => {
                if (!this.currentRecipient?.publicKey || /^0*$/.test(this.currentRecipient.publicKey)) {
                    this.resetEncryptedMessage();
                }
            });
        } else {
            this.resetEncryptedMessage();
        }
        this.triggerChange();
    }

    /**
     * Handler when changing max fee
     */
    onChangeMaxFee() {
        if (this.formItems.recipientRaw && this.formItems.recipientRaw !== '') {
            this.triggerChange();
        }
    }

    triggerChange() {
        if (AddressValidator.validate(this.formItems.recipientRaw)) {
            this.transactions = this.getTransactions();
            // avoid error
            if (this.transactions) {
                this.calculateDynamicFees();
            }
        } else {
            this.transactions = null;
            this.resetDynamicFees();
            this.resetEncryptedMessage();
        }
    }

    /**
     * Resetting the form when choosing a multisig signer and changing multisig signer
     * Is necessary to make the mosaic inputs reactive
     */
    @Watch('selectedSigner')
    onSelectedSignerChange() {
        this.formItems.signerAddress = this.selectedSigner.address.plain();
        if (this.isMultisigMode()) {
            this.resetForm();
        }
    }

    /**
     * ModalTransactionUriImport modal page close event handler
     */
    onImportTransactionURIModalClose() {
        this.isImportTransactionUriModalVisible = false;
    }

    /**
     * Import transactionURI complete event handler
     * @param transaction transaction to be imported
     */
    onImportTransaction(transaction: Transaction) {
        this.importedTransaction = transaction;
        this.resetForm();
    }

    /**
     * Encrypt message checkbox click
     */
    onEncryptionChange() {
        if (this.formItems.encryptMessage) {
            if (!this.currentRecipient?.publicKey) {
                this.$store
                    .dispatch('notification/ADD_ERROR', this.$t(NotificationType.RECIPIENT_PUBLIC_KEY_INVALID_ERROR))
                    .then(() => (this.formItems.encryptMessage = false));
            } else if (!this.formItems.messagePlain) {
                this.$store
                    .dispatch('notification/ADD_ERROR', this.$t(NotificationType.ENCRYPTED_MESSAGE_EMPTY_ERROR))
                    .then(() => (this.formItems.encryptMessage = false));
            } else {
                this.hasAccountUnlockModal = true;
            }
        } else {
            this.encyptedMessage = null;
            this.hasAccountUnlockModal = false;
        }

        this.triggerChange();
    }

    /**
     * Hook called when the account has been unlocked
     * @param {Account} account
     * @return {boolean}
     */
    onAccountUnlocked(account: Account): boolean {
        this.hasAccountUnlockModal = false;
        this.encyptedMessage = this.formItems.messagePlain
            ? EncryptedMessage.create(this.formItems.messagePlain, this.currentRecipient, account.privateKey)
            : PlainMessage.create('');
        this.formItems.encryptMessage = true;
        this.triggerChange();
        return true;
    }

    closeAccountUnlockModal() {
        this.formItems.encryptMessage = false;
        this.hasAccountUnlockModal = false;
    }

    /**
     * Calculates the dynamic fees based on the txs size
     * */
    private calculateDynamicFees() {
        this.createTransactionCommandForFee(feesConfig.median)
            .getTotalMaxFee()
            .subscribe((val) => (this.calculatedRecommendedFee = val.compact()));

        this.createTransactionCommandForFee(feesConfig.highest)
            .getTotalMaxFee()
            .subscribe((val) => (this.calculatedHighestFee = val.compact()));
    }

    /**
     * Creates a TransactionCommand object to calculate total fee
     * for the given dynamic fee (Recommended/Highest)
     * @param {number} maxFee
     */
    private createTransactionCommandForFee(maxFee: number): TransactionCommand {
        const transactions = this.getTransactions().map((t) => {
            //@ts-ignore
            t.maxFee = UInt64.fromUint(maxFee);
            return t;
        });

        const mode = this.getTransactionCommandMode(transactions);
        return new TransactionCommand(
            mode,
            this.selectedSigner,
            this.currentSignerPublicKey,
            transactions,
            this.networkMosaic,
            this.generationHash,
            this.epochAdjustment,
            this.networkType,
            this.networkConfiguration,
            this.transactionFees,
            this.currentSignerMultisigInfo ? this.currentSignerMultisigInfo.minApproval : this.selectedSigner.requiredCosignatures,
        );
    }

    /**
     * Resets calculated dynamic fees
     */
    private resetDynamicFees() {
        this.calculatedRecommendedFee = 0;
        this.calculatedHighestFee = 0;
    }

    /**
     * Reset encrypted message
     */
    private resetEncryptedMessage() {
        this.encyptedMessage = null;
        this.formItems.encryptMessage = false;
        this.hasAccountUnlockModal = false;
        this.$store.dispatch('account/GET_RECIPIENT', null);
    }
    /**
     * emit formItems values to aggregate transaction form to be saved in storage
     */
    public emitToAggregate() {
        if (this.transactions && this.transactions[0]) {
            this.formItems.signerPublicKey = this.currentSignerPublicKey;
            this.$emit('txInput', this.formItems);
        }
    }
    mounted() {
        if (this.isAggregate && this.value) {
            Object.assign(this.formItems, this.value);
        }

        this.isMounted = true;
    }
    /**
     * watch title to change form items on select different transactions
     */
    @Watch('title', { immediate: true })
    onTitleChange() {
        if (this.isAggregate && this.value) {
            Object.assign(this.formItems, this.value);
        }
    }
}