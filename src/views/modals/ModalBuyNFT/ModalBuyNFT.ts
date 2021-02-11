/*
 * Copyright 2020 NEM (https://nem.io)
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
import { Component, Prop } from 'vue-property-decorator';

// child components
// @ts-ignore
import TransactionDetails from '@/components/TransactionDetails/TransactionDetails.vue';
import ModalTransactionConfirmation from '@/views/modals/ModalTransactionConfirmation/ModalTransactionConfirmation.vue';
import { FormTransferTransactionTs } from './../../forms/FormTransferToken/FormTransferTokenTs';

@Component({
    components: {
        TransactionDetails,
        ModalTransactionConfirmation,
    },
})
export class ModalBuyNFTts extends FormTransferTransactionTs {
    @Prop({
        default: false,
    })
    visible: boolean;

    @Prop({
        required: true,
    })
    imageLink: string;

    @Prop({
        required: true,
    })
    mosaicId: string;

    @Prop({
        required: true,
    })
    nftInfo: string;

    @Prop({
        required: true,
    })
    price: string;

    @Prop({
        required: true,
    })
    time: string;

    @Prop({
        required: true,
    })
    title: string;

    /// region computed properties

    /**
     * Visibility state
     * @type {boolean}
     */
    public get show(): boolean {
        return this.visible;
    }

    /**
     * Emits close event
     */
    public set show(val) {
        if (!val) {
            this.$emit('close');
        }
    }

    /// end-region computed properties
}
