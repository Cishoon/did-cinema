/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { type Contract } from 'fabric-contract-api';
import { DIDContract } from './did/DIDContract';
import { NFTicketContract } from './NFTicket/NFTicketContract';


export const contracts: typeof Contract[] = [DIDContract, NFTicketContract];
