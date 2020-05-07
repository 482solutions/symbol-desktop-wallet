/*
 * Copyright 2020 NEM Foundation (https://nem.io)
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
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class ImportProfileTs extends Vue {
  /**
   * List of steps
   * @var {string[]}
   */
  public StepBarTitleList = ['create_profile', 'Mnemonic_Phrase', 'select_accounts', 'Finish']

  public LedgerStepBarTitleList = ['Create Account','Import Ledger']

  isLedger = false
  public titleList = []
    
  public created() {
    const {isLedger} = this.$route.meta
    if (isLedger) {
      this.titleList = this.LedgerStepBarTitleList
    } else
    {this.titleList = this.StepBarTitleList}
  }
  /**
   * Hook called when the page is mounted
   * @return {void}
   */
  async mounted() {
    await this.$store.dispatch('temporary/initialize')
  }

  public getCurrentStep(): number {
    const {isLedger} = this.$route.meta
    if(isLedger){
      switch (this.$route.name){
        default:
          case 'accounts.importLedgerAccount': return 0
          case 'accounts.importLedger': return 1
      }
    } else {
      switch (this.$route.name) {
        default:
        case 'profiles.importProfile.info':
          return 0
        case 'profiles.importProfile.importMnemonic':
          return 1
        case 'profiles.importProfile.walletSelection':
          return 2
        case 'profiles.importProfile.finalize':
          return 3
      }
    }
  }

  public getStepClassName(index: number): string {
    return this.getCurrentStep() >= index ? 'white' : 'gray'
  }
}
