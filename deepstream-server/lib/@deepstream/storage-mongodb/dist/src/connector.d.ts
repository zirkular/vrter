import { Collection } from 'mongodb';
import { DeepstreamPlugin, DeepstreamStorage, DeepstreamServices, StorageWriteCallback, StorageReadCallback } from '@deepstream/types';
import { JSONObject } from '@deepstream/protobuf/dist/types/all';
interface MongoOptions {
    connectionString: any;
    db: string;
    defaultCollection: string;
    splitChar: string;
}
/**
 * Connects deepstream to MongoDb.
 *
 * Collections, ids and performance
 * --------------------------------------------------
 * Deepstream treats its storage like a simple key value store. But there are a few things
 * we can do to speed it up when using MongoDb. Mainly: using smaller (e.g. more granular) collections and using successive Id's
 *
 *
 * To support multiple collections pass a splitChar setting to this class. This setting specifies a character
 * at which keys will be split and ordered into collections. This sounds a bit complicated, but all that means is the following:
 *
 * Imagine you want to store a few users. Just specify their recordNames as e.g.
 *
 *  user/i4vcg5j1-16n1qrnziuog
 *  user/i4vcg5x9-a2wc3g9pbhmi
 *  user/i4vcg74u-21ufhl1qs8fh
 *
 * and in your options set
 *
 * { splitChar: '/' }
 *
 * This way the MongoDB connector will create a 'user' collection the first time
 * it encounters this recordName and will subsequently store users in it. This will
 * improve the speed of read operations since MongoDb has to look through a smaller
 * amount of datasets to find your record
 *
 * On top of this, it makes sense to use successive ids. MongoDb will optimise collections
 * by putting documents with similar ids next to each other. Fortunately, the build-in getUid()
 * method of the deepstream client already produces semi-succesive ids. Notice how the first bits of the
 * ids (user/i4vcg5) are all the same. These are Base36 encoded timestamps, facilitating almost succesive ordering.
 *
 * {
 *    // Optional: Collections for items without a splitChar or if no splitChar is specified. Defaults to 'deepstream_docs'
   defaultCollection: <String>,

   // Optional: A char that seperates the collection name from the document id. Defaults to null
   splitChar: <String>,

   // Full connection URL for MongoDb. Format is mongodb://[username:password@]host1[:port1][,host2[:port2],...[,hostN[:portN]]][/[database][?options]]
   // More details can be found here: http://docs.mongodb.org/manual/reference/connection-string/
   connectionString: <String>
   }
 */
export declare class Connector extends DeepstreamPlugin implements DeepstreamStorage {
    private options;
    private services;
    apiVersion?: number | undefined;
    description: string;
    private splitChar;
    private defaultCollection;
    private collections;
    private logger;
    private client;
    private db;
    constructor(options: MongoOptions, services: DeepstreamServices);
    whenReady(): Promise<void>;
    /**
     * Writes a value to the cache.
     */
    set(key: string, version: number, value: JSONObject, callback: StorageWriteCallback): void;
    /**
     * Retrieves a value from the cache
     */
    get(key: string, callback: StorageReadCallback): void;
    /**
     * Deletes an entry from the cache.
     */
    delete(key: string, callback: StorageWriteCallback): void;
    deleteBulk(recordNames: string[], callback: StorageWriteCallback): void;
    /**
     * Determines the document id and the collection
     * to use based on the provided key
     *
     * Creates the collection if it doesn't exist yet.
     *
     * Since MongoDB Object IDs are adhering to a specified format
     * we'll add a new field for the key called ds_key and index the
     * collection based on it
     */
    getParams(key: string): {
        collection: Collection<any>;
        id: string;
    } | null;
    /**
     * Returns a MongoConnection object given its name.
     * Creates the collection if it doesn't exist yet.
     */
    getCollection(collectionName: string): Collection<any>;
}
export default Connector;
