import path from 'path'
import {postgresAdapter} from '@payloadcms/db-postgres'
import {webpackBundler} from '@payloadcms/bundler-webpack'
import {
    HTMLConverterFeature,
    lexicalEditor,
    LinkFeature,
    RelationshipFeature,
    BlocksFeature
} from "@payloadcms/richtext-lexical";
import {buildConfig} from 'payload/config'
import search from '@payloadcms/plugin-search'
import formBuilder from '@payloadcms/plugin-form-builder'
import seoPlugin from '@payloadcms/plugin-seo'

import Users from './collections/Users'
import {Navigation} from "./globals/Navigation/Navigation";
import {SiteOptions} from "./globals/SiteOptions";
import {Media} from "./collections/Media";
import {Pages} from "./collections/Pages";
import {Hours} from "./globals/Hours/Hours";
import {Footer} from "./globals/Footer";
import {revalidate} from "./utilities/revalidate";
import payload from "payload";
import {revalidateForm} from "./collections/Forms/hooks/revalidateForm";
import FileUploadBlock from "./blocks/FileUploadBlock";
import {UserUploadedFormDocuments} from "./collections/UserUploadedFormDocuments";
import {Employment} from "./collections/Employment";
import {MuseumCollections} from "./collections/MuseumCollections";
import {ContinuingToImpact} from "./collections/ContinuingToImpact";
import {StudentSpotlight} from "./collections/StudentSpotlight";
import {PassionsForTheProject} from "./collections/PassionsForTheProject";
import {collectionSlugs} from "./blocks/fields/collectionSlugs";
import {Support} from "./collections/Support";
import {EventCollections} from "./collections/Events";
import {fixDuplicationCollectionHook} from "./hooks/fixDuplicationCollectionHook";
import {Calendar} from "./globals/Calendar/Calendar";
import {EventCategories} from "./collections/Events/EventCategories";
import HoursBlock from "./blocks/HoursBlock";
import {Admission} from "./globals/Admission/Admission";
import AdmissionBlock from "./blocks/AdmissionBlock";
import redirects from "@payloadcms/plugin-redirects";
import sendEmail from './hooks/sendEmail';
import {News} from './collections/News';
import {Banner} from "./globals/Banner";
import IFrame from "./blocks/IFrame";
import {Modals} from './collections/Modals';
import {isAdmin} from "./access/isAdmin";
import {isAdminOrPublished} from "./access/isAdminOrPublished";
// @ts-ignore
export default buildConfig({
    admin: {
        user: Users.slug,
        bundler: webpackBundler(),
    },
    cors: [
        process.env.PAYLOAD_PUBLIC_NEXT_URL,
        process.env.PAYLOAD_PUBLIC_SERVER_URL
    ],
    csrf: [
        process.env.PAYLOAD_PUBLIC_NEXT_URL,
        process.env.PAYLOAD_PUBLIC_SERVER_URL
    ],
    rateLimit: {
        max: 2000,
        trustProxy: true
    },
    editor:
        lexicalEditor({
            features: ({defaultFeatures}) => {
                return [
                    ...defaultFeatures.filter(feature => {
                        return feature.key !== 'upload' && feature.key !== 'checkList'
                    }),
                    LinkFeature({
                        enabledCollections: [...collectionSlugs, "media"]
                    }),
                    RelationshipFeature({
                        enabledCollections: collectionSlugs
                    }),
                    HTMLConverterFeature({}),
                    BlocksFeature({
                        blocks: [HoursBlock, AdmissionBlock, IFrame]
                    })
                ]
            }
        }),
    serverURL:
    process.env.PAYLOAD_PUBLIC_SERVER_URL,
    collections:
        [Users, Media, Pages, Modals, UserUploadedFormDocuments, Employment, MuseumCollections, ContinuingToImpact, StudentSpotlight, PassionsForTheProject, Support, EventCollections, EventCategories, News],
    globals:
        [Navigation, SiteOptions, Hours, Footer, Calendar, Admission, Banner],
    typescript:
        {
            outputFile: path.resolve(__dirname, 'payload-types.ts'),
        }
    ,
    graphQL: {
        schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
    }
    ,
    plugins: [
        redirects({
            overrides: {
                access:{
                    read: isAdmin(),
                    create: isAdmin(),
                    update: isAdmin(),
                    delete: isAdmin()
                },
            },
            collections: [...collectionSlugs]
        }),
        seoPlugin({
            collections: [
                ...collectionSlugs
            ],
            uploadsCollection: 'media',
            generateTitle: ({doc}) => {
                // @ts-ignore
                if (doc.title.value === "home") {
                    return 'Crazy Horse Memorial®'
                } else {
                    // @ts-ignore
                    return `Crazy Horse Memorial® - ${doc.title.value}`
                }
            },
            // @ts-ignore
            generateDescription: ({doc}) => doc.excerpt.value
        }),
        formBuilder({
            fields: {
                payment: false,
                FileUploadBlock
            },
            formOverrides: {
                admin: {
                    hidden: ({user}) => user.role !== "admin"
                },
                access: {
                    read: () => true,
                    create: isAdmin(),
                    update: isAdmin(),
                    delete: isAdmin()
                },
                hooks: {
                    beforeChange: [fixDuplicationCollectionHook],
                    afterChange: [revalidateForm]
                },
                fields: [
                    {
                        name: "showFieldTable",
                        type: "checkbox",
                        defaultValue: true
                    }
                ]
            },
            formSubmissionOverrides: {
                access: {
                    read: isAdmin(),
                    create: () => true,
                    update: isAdmin(),
                    delete: isAdmin()
                },
                hooks: {
                    beforeChange: [
                        (data) => sendEmail(data),
                    ]
                }
            }
        }),
        search({
            searchOverrides: {
                access: {
                    read: () => true,
                    create: isAdmin(),
                    update: isAdmin(),
                    delete: isAdmin()
                },
            },
            collections: collectionSlugs,
            defaultPriorities: {
                pages: 10
            },
            beforeSync: ({originalDoc, searchDoc}) => {

                revalidate({payload, collection: 'search', slug: ""})

                return searchDoc;
            }
        })
    ],
    db:
        postgresAdapter({
            pool: {
                connectionString: process.env.DATABASE_URI,
            },
        }),
})
