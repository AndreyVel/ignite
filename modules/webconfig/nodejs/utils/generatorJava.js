/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var generatorUtils = require("./generatorUtils");

exports.generateClusterConfiguration = function(cluster) {
    var res = generatorUtils.builder();

    res.line('IgniteConfiguration cfg = new IgniteConfiguration();');
    res.line();

    if (cluster.discovery) {
        var d = cluster.discovery;

        res.line('TcpDiscoverySpi discovery = new TcpDiscoverySpi();');
        switch (d.kind) {
            case 'Multicast':
                addBeanWithProperties(res, d.Multicast, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoveryMulticastIpFinder', {
                        multicastGroup: null,
                        multicastPort: null,
                        responseWaitTime: null,
                        addressRequestAttempts: null,
                        localAddress: null
                    }, true);

                break;

            case 'Vm':
                addBeanWithProperties(res, d.Vm, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoveryVmIpFinder', {addresses: 'list'}, true);

                break;

            case 'S3':
                if (d.S3) {
                    addBeanWithProperties(res, d.S3, 'discovery', 'ipFinder', 'ipFinder',
                        'TcpDiscoveryS3IpFinder', {bucketName: null}, true);
                }
                else {
                    res.line('discovery.setIpFinder(new TcpDiscoveryS3IpFinder());');
                }

                break;

            case 'Cloud':
                addBeanWithProperties(res, d.Cloud, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoveryCloudIpFinder', {
                        credential: null,
                        credentialPath: null,
                        identity: null,
                        provider: null
                    }, true);

                break;

            case 'GoogleStorage':
                addBeanWithProperties(res, d.GoogleStorage, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoveryGoogleStorageIpFinder', {
                        projectName: null,
                        bucketName: null,
                        serviceAccountP12FilePath: null
                    }, true);

                //if (d.GoogleStorage.addrReqAttempts) todo ????
                //    res.line('<property name="serviceAccountP12FilePath" value="' + escapeAttr(d.GoogleStorage.addrReqAttempts) + '"/>');

                break;

            case 'Jdbc':
                res.line();
                res.line('TcpDiscoveryJdbcIpFinder ipFinder = new TcpDiscoveryJdbcIpFinder();');
                res.line('ipFinder.setInitSchema(' + (d.Jdbc.initSchema != null || d.Jdbc.initSchema) + ');');
                res.line('discovery.setIpFinder(ipFinder);');
                res.needEmptyLine = true;

                break;

            case 'SharedFs':
                addBeanWithProperties(res, d.SharedFs, 'discovery', 'ipFinder', 'ipFinder',
                    'TcpDiscoverySharedFsIpFinder', {path: null}, true);

                break;

            default:
                throw "Unknown discovery kind: " + d.kind;
        }

        res.emptyLineIfNeeded();

        res.line('cfg.setDiscoverySpi(discovery);');

        res.needEmptyLine = true;
    }

    addBeanWithProperties(res, cluster.atomicConfiguration, 'cfg', 'atomicConfiguration', 'atomicCfg', 'AtomicConfiguration', {
        backups: null,
        cacheMode: 'CacheMode',
        atomicSequenceReserveSize: null});

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'networkTimeout');
    addProperty(res, cluster, 'cfg', 'networkSendRetryDelay');
    addProperty(res, cluster, 'cfg', 'networkSendRetryCount');
    addProperty(res, cluster, 'cfg', 'segmentCheckFrequency');
    addProperty(res, cluster, 'cfg', 'waitForSegmentOnStart');
    addProperty(res, cluster, 'cfg', 'discoveryStartupDelay');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'deploymentMode', 'DeploymentMode');

    res.needEmptyLine = true;

    addListProperty(res, cluster, 'cfg', 'includeEventTypes');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'marshalLocalJobs');
    addProperty(res, cluster, 'cfg', 'marshCacheKeepAliveTime');
    addProperty(res, cluster, 'cfg', 'marshCachePoolSize');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'metricsExpireTime');
    addProperty(res, cluster, 'cfg', 'metricsHistorySize');
    addProperty(res, cluster, 'cfg', 'metricsLogFrequency');
    addProperty(res, cluster, 'cfg', 'metricsUpdateFrequency');
    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'peerClassLoadingEnabled');
    addMultiparamProperty(res, cluster, 'cfg', 'peerClassLoadingLocalClassPathExclude');
    addProperty(res, cluster, 'cfg', 'peerClassLoadingMissedResourcesCacheSize');
    addProperty(res, cluster, 'cfg', 'peerClassLoadingThreadPoolSize');
    res.needEmptyLine = true;

    addBeanWithProperties(res, cluster.swapSpaceSpi.FileSwapSpaceSpi, 'cfg', 'swapSpaceSpi', 'swapSpi', 'FileSwapSpaceSpi', {
        baseDirectory: null,
        readStripesNumber: null,
        maximumSparsity: 'f',
        maxWriteQueueSize: null,
        writeBufferSize: null
    }, true);

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'clockSyncSamples');
    addProperty(res, cluster, 'cfg', 'clockSyncFrequency');
    addProperty(res, cluster, 'cfg', 'timeServerPortBase');
    addProperty(res, cluster, 'cfg', 'timeServerPortRange');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'publicThreadPoolSize');
    addProperty(res, cluster, 'cfg', 'systemThreadPoolSize');
    addProperty(res, cluster, 'cfg', 'managementThreadPoolSize');
    addProperty(res, cluster, 'cfg', 'igfsThreadPoolSize');

    res.needEmptyLine = true;

    addBeanWithProperties(res, cluster.transactionConfiguration, 'cfg', 'transactionConfiguration',
        'transactionConfiguration', 'TransactionConfiguration', {
            defaultTxConcurrency: 'TransactionConcurrency',
            transactionIsolation: 'TransactionIsolation',
            defaultTxTimeout: null,
            pessimisticTxLogLinger: null,
            pessimisticTxLogSize: null,
            txSerializableEnabled: null
        });

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'cacheSanityCheckEnabled');

    res.needEmptyLine = true;

    addProperty(res, cluster, 'cfg', 'segmentationPolicy', 'SegmentationPolicy');
    addProperty(res, cluster, 'cfg', 'segmentationResolveAttempts');
    addProperty(res, cluster, 'cfg', 'allSegmentationResolversPassRequired');

    res.needEmptyLine = true;

    res.needEmptyLine = true;
    addProperty(res, cluster, 'cfg', 'utilityCacheKeepAliveTime');
    addProperty(res, cluster, 'cfg', 'utilityCachePoolSize');

    return res.join('');
};

function createEvictionPolicy(res, evictionPolicy, varName, propertyName) {
    if (evictionPolicy && evictionPolicy.kind) {
        var e = generatorUtils.evictionPolicies[evictionPolicy.kind];

        var obj = evictionPolicy[evictionPolicy.kind.toUpperCase()];

        addBeanWithProperties(res, obj, varName, propertyName, propertyName, e.shortClassName, e.fields, true);
    }
}

exports.generateCacheConfiguration = function(cacheCfg, varName, res) {
    if (!res)
        res = generatorUtils.builder();
    
    res.line('CacheConfiguration ' + varName + ' = new CacheConfiguration();');
    
    res.needEmptyLine = true;

    if (cacheCfg.mode) {
        res.emptyLineIfNeeded();

        res.line(varName + '.setCacheMode(CacheMode.' + cacheCfg.mode  + ');');
    }

    addProperty(res, cacheCfg, varName, 'atomicityMode', 'CacheAtomicityMode');
    addProperty(res, cacheCfg, varName, 'backups');
    
    res.needEmptyLine = true;
    
    addProperty(res, cacheCfg, varName, 'memoryMode', 'CacheMemoryMode');
    addProperty(res, cacheCfg, varName, 'offHeapMaxMemory');
    addProperty(res, cacheCfg, varName, 'swapEnabled');

    res.needEmptyLine = true;

    createEvictionPolicy(res, cacheCfg.evictionPolicy, varName, 'evictionPolicy');

    res.needEmptyLine = true;
    
    addBeanWithProperties(res, cacheCfg.nearConfiguration, varName, 'nearConfiguration', 'nearConfiguration',
        'NearCacheConfiguration', {nearStartSize: null, atomicSequenceReserveSize: null}, true);
    
    if (cacheCfg.nearConfiguration && cacheCfg.nearConfiguration.nearEvictionPolicy && cacheCfg.nearConfiguration.nearEvictionPolicy.kind) {
        createEvictionPolicy(res, cacheCfg.nearConfiguration.nearEvictionPolicy, 'nearConfiguration', 'nearEvictionPolicy');
    }

    res.needEmptyLine = true;
    
    addProperty(res, cacheCfg, varName, 'sqlEscapeAll');
    addProperty(res, cacheCfg, varName, 'sqlOnheapRowCacheSize');
    addProperty(res, cacheCfg, varName, 'longQueryWarningTimeout');
    
    if (cacheCfg.indexedTypes && cacheCfg.indexedTypes.length > 0) {
        res.emptyLineIfNeeded();
        
        res.append(varName + '.setIndexedTypes(');
        
        for (var i = 0; i < cacheCfg.indexedTypes.length; i++) {
            if (i > 0)
                res.append(', ');

            var pair = cacheCfg.indexedTypes[i];
            
            res.append(toJavaCode(pair.keyClass, 'class')).append(', ').append(toJavaCode(pair.valueClass, 'class'))
        }
        
        res.line(');');
    }

    addMultiparamProperty(res, cacheCfg, varName, 'sqlFunctionClasses', 'class');
    
    res.needEmptyLine = true;

    addProperty(res, cacheCfg, varName, 'rebalanceMode', 'CacheRebalanceMode');
    addProperty(res, cacheCfg, varName, 'rebalanceThreadPoolSize');
    addProperty(res, cacheCfg, varName, 'rebalanceBatchSize');
    addProperty(res, cacheCfg, varName, 'rebalanceOrder');
    addProperty(res, cacheCfg, varName, 'rebalanceDelay');
    addProperty(res, cacheCfg, varName, 'rebalanceTimeout');
    addProperty(res, cacheCfg, varName, 'rebalanceThrottle');

    res.needEmptyLine = true;
    
    if (cacheCfg.store) {
        switch (cacheCfg.store.kind) {
            case 'CacheJdbcPojoStoreFactory':
                addBeanWithProperties(res, cacheCfg.store[cacheCfg.store.kind], varName, 'cacheStoreFactory',
                    'cacheStoreFactory', 'CacheJdbcPojoStoreFactory', {
                        dataSourceBean: null,
                        dialect: null
                    }, true);
        
                break;

            case 'CacheJdbcBlobStoreFactory':
                addBeanWithProperties(res, cacheCfg.store[cacheCfg.store.kind], varName, 'cacheStoreFactory',
                    'cacheStoreFactory', 'CacheJdbcBlobStoreFactory', {
                        multicastGroup: null,
                        multicastPort: null,
                        responseWaitTime: null,
                        addressRequestAttempts: null,
                        localAddress: null
                    }, true);
        
                break;
            
            case 'CacheHibernateBlobStoreFactory':
                addBeanWithProperties(res, cacheCfg.store[cacheCfg.store.kind], varName, 'cacheStoreFactory',
                    'cacheStoreFactory', 'CacheHibernateBlobStoreFactory', {
                        hibernateProperties: 'list'
                    }, true);
        
                break;
        }
    }

    res.needEmptyLine = true;
    
    addProperty(res, cacheCfg, varName, 'invalidate');
    addProperty(res, cacheCfg, varName, 'defaultLockTimeout');
    addProperty(res, cacheCfg, varName, 'transactionManagerLookupClassName');
    
    res.needEmptyLine = true;
    
    addProperty(res, cacheCfg, varName, 'writeBehindEnabled');
    addProperty(res, cacheCfg, varName, 'writeBehindBatchSize');
    addProperty(res, cacheCfg, varName, 'writeBehindFlushSize');
    addProperty(res, cacheCfg, varName, 'writeBehindFlushFrequency');
    addProperty(res, cacheCfg, varName, 'writeBehindFlushThreadCount');
    
    res.needEmptyLine = true;

    addProperty(res, cacheCfg, varName, 'statisticsEnabled');
    addProperty(res, cacheCfg, varName, 'managementEnabled');
    addProperty(res, cacheCfg, varName, 'readFromBackup');
    addProperty(res, cacheCfg, varName, 'copyOnRead');
    addProperty(res, cacheCfg, varName, 'maxConcurrentAsyncOperations');
    
    return res;
};

function toJavaCode(val, type) {
    if (val == null)
       return 'null';

    if (type == 'f')
        return val + 'f';
    
    if (type == 'class')
        return val + '.class';
    
    if (type)
        return type + '.' + val;
    
    if (typeof(val) == 'string')
        return '"' + val.replace('"', '\\"') + '"';

    if (typeof(val) == 'number' || typeof(val) == 'boolean')
        return '' + val;

    throw "Unknown type: " + typeof(val) + ' (' + val + ')';
}

function addProperty(res, obj, objVariableName, propName, enumType) {
    var val = obj[propName];
    
    if (val) {
        res.emptyLineIfNeeded();
        
        res.line(objVariableName + '.' + getSetterName(propName) + '(' + toJavaCode(val, enumType)  + ');');
    }
}

function getSetterName(propName) {
    return 'set' + propName.charAt(0).toLocaleUpperCase() + propName.slice(1);
}

function addListProperty(res, obj, objVariableName, propName, enumType) {
    var val = obj[propName];
    
    if (val && val.length > 0) {
        var setterName = getSetterName(propName);
        
        res.append(objVariableName + '.' + setterName + '(Arrays.asList(');

        for (var i = 0; i < val.length; i++) {
            if (i > 0)
                res.append(', ');
            
            res.append(toJavaCode(val[i], enumType));
        }
        
        res.line('));');
    }
}

function addMultiparamProperty(res, obj, objVariableName, propName, type) {
    var val = obj[propName];
    
    if (val && val.length > 0) {
        var setterName = getSetterName(propName);
        
        res.append(objVariableName + '.' + setterName + '(');

        for (var i = 0; i < val.length; i++) {
            if (i > 0)
                res.append(', ');
            
            res.append(toJavaCode(val[i], type));
        }
        
        res.line(');');
    }
}

function addBeanWithProperties(res, bean, objVarName, beanPropName, beanVarName, beanClass, props, alwaysCreateBean) {
    if (!bean)
        return;
    
    var hasProps = false;
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            if (bean[propName]) {
                hasProps = true;
                break;
            }
        }
    }
    
    if (hasProps) {
        if (!res.emptyLineIfNeeded()) {
            res.line();
        }
        
        res.line(beanClass + ' ' + beanVarName + ' = new ' + beanClass + '();');
        for (propName in props) {
            if (props.hasOwnProperty(propName)) {
                var val = bean[propName];
                if (val) {
                    var type = props[propName];
                    
                    if (type == 'list') {
                        addListProperty(res, bean, beanVarName, propName);
                    }
                    else {
                        addProperty(res, bean, beanVarName, propName, type);
                    }
                }
            }
        }
        res.line(objVarName + '.' + getSetterName(beanPropName) + '(' + beanVarName + ');');
        
        res.needEmptyLine = true;
    }
    else if (alwaysCreateBean) {
        res.emptyLineIfNeeded();
        
        res.line(objVarName + '.' + getSetterName(beanPropName) + '(new ' + beanClass + '());');
    }
}
