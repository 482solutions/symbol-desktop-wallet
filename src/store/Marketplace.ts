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
import Vue from 'vue';
// internal dependencies
import { AwaitLock } from './AwaitLock';
import { MarketplaceService, MosaicMarketplace } from '@/services/MarketplaceService';
import { Address, RepositoryFactory } from 'symbol-sdk';

const Lock = AwaitLock.create();

/**
 * Community Store
 */
export default {
    namespaced: true,
    state: {
        initialized: false,
        mosaics: [],
        isFetchingMarketplace: false,
        serviceAddress: Address.createFromRawAddress('TBXILOQ3AMTVWOQSIWDMCXD3S4L5QWPQU2TWZJI'),
    },
    getters: {
        getInitialized: (state) => state.initialized,
        isFetchingMarketplace: (state) => state.isFetchingMarketplace,
        allTokens: (state) => state.mosaics,
        serviceAddress: (state) => state.serviceAddress,
    },
    mutations: {
        setInitialized: (state, initialized) => {
            state.initialized = initialized;
        },
        addTokens: (state, mosaics: MosaicMarketplace[]): void => {
            Vue.set(state, 'mosaics', mosaics);
        },
        isFetchingMarketplace: (state, isFetchingMarketplace: boolean) => {
            Vue.set(state, 'isFetchingMarketplace', isFetchingMarketplace);
        },
    },
    actions: {
        async initialize({ commit, dispatch, getters }) {
            const callback = async () => {
                // fetch tokens
                await dispatch('FETCH_TOKENS');
                commit('setInitialized', true);
            };
            await Lock.initialize(callback, { getters });
        },
        async uninitialize({ commit, getters }) {
            const callback = async () => {
                commit('setInitialized', false);
            };
            await Lock.uninitialize(callback, { getters });
        },
        /// region scoped actions
        async FETCH_TOKENS({ commit, rootGetters }) {
            const repositoryFactory: RepositoryFactory = rootGetters['network/repositoryFactory'];

            commit('isFetchingMarketplace', true);
            const marketplaceService = new MarketplaceService();
            const marketplace = await marketplaceService.getAllTokens(repositoryFactory);
            marketplace.subscribe((mosaics: MosaicMarketplace[]) => {
                setTimeout(() => {
                    commit('addTokens', mosaics);
                    commit('isFetchingMarketplace', false);
                }, 1000);
            });
        },
    },
};
