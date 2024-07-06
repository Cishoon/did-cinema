/*
 * SPDX-License-Identifier: Apache-2.0
 */

import {type Contract} from 'fabric-contract-api';
import { DIDContract } from './did/DIDContract';


export const contracts: typeof Contract[] = [DIDContract];
