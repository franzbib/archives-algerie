import type { ArchiveCollection, ArchiveFolder, ArchiveStats } from "./archive-types";

export const archiveCollections: ArchiveCollection[] = [
  {
    id: "collection-algerie-administration",
    title: "Administration territoriale en Algerie",
    code: "ALG-ADM",
    description:
      "Sous-ensemble de dossiers administratifs relatifs a l'organisation territoriale, aux communes mixtes et aux correspondances de service.",
    dateRange: {
      start: "1848",
      end: "1962",
      label: "1848-1962",
    },
    provenance: "Versements administratifs et fonds publics conserves en serie historique.",
    status: "processing",
    folders: [
      {
        id: "folder-communes-mixtes",
        title: "Communes mixtes",
        callNumber: "ALG-ADM/CM",
        description:
          "Dossiers classes par circonscription, avec pieces de correspondance et etats recapitulatif.",
        dateRange: {
          start: "1875",
          end: "1956",
          label: "1875-1956",
        },
        children: [
          {
            id: "folder-constantine",
            title: "Departement de Constantine",
            callNumber: "ALG-ADM/CM/CON",
            dateRange: {
              start: "1882",
              end: "1937",
              label: "1882-1937",
            },
            documents: [
              {
                id: "doc-constantine-rapport-1901",
                title: "Rapport annuel sur l'administration locale",
                callNumber: "ALG-ADM/CM/CON/1901-01",
                kind: "administrative-file",
                date: "1901",
                language: ["fr"],
                physicalDescription: "1 dossier papier, 18 feuillets",
                rights: "Consultation libre, reproduction a verifier.",
                pages: [
                  {
                    id: "page-constantine-rapport-1901-001",
                    pageNumber: 1,
                    label: "Couverture",
                    imageReference: "placeholder://ALG-ADM-CM-CON-1901-01-p001",
                    preservationState: "stable",
                  },
                  {
                    id: "page-constantine-rapport-1901-002",
                    pageNumber: 2,
                    label: "Introduction",
                    imageReference: "placeholder://ALG-ADM-CM-CON-1901-01-p002",
                    preservationState: "fragile",
                    notes: "Bord droit fragilise.",
                  },
                ],
              },
            ],
          },
          {
            id: "folder-oran",
            title: "Departement d'Oran",
            callNumber: "ALG-ADM/CM/ORA",
            dateRange: {
              start: "1890",
              end: "1949",
              label: "1890-1949",
            },
            documents: [
              {
                id: "doc-oran-correspondance-1912",
                title: "Correspondance prefectorale",
                callNumber: "ALG-ADM/CM/ORA/1912-04",
                kind: "correspondence",
                date: "1912",
                language: ["fr", "ar"],
                physicalDescription: "12 pieces manuscrites et dactylographiees",
                pages: [
                  {
                    id: "page-oran-correspondance-1912-001",
                    pageNumber: 1,
                    label: "Lettre recue",
                    imageReference: "placeholder://ALG-ADM-CM-ORA-1912-04-p001",
                    preservationState: "stable",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "folder-cartes-plans",
        title: "Cartes et plans administratifs",
        callNumber: "ALG-ADM/CP",
        documents: [
          {
            id: "doc-carte-administrative-1930",
            title: "Carte administrative generale",
            callNumber: "ALG-ADM/CP/1930-01",
            kind: "map",
            date: "1930",
            language: ["fr"],
            physicalDescription: "1 carte pliee, couleur",
            pages: [
              {
                id: "page-carte-administrative-1930-001",
                pageNumber: 1,
                imageReference: "placeholder://ALG-ADM-CP-1930-01-p001",
                preservationState: "damaged",
                notes: "Dechirure au pli central.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "collection-algerie-etat-civil",
    title: "Registres et etat civil",
    code: "ALG-EC",
    description:
      "Registres et pieces associees aux actes d'etat civil, organises par territoire, commune et periode.",
    dateRange: {
      start: "1830",
      end: "1962",
      label: "1830-1962",
    },
    provenance: "Copies de registres et instruments de recherche historiques.",
    status: "inventoried",
    folders: [
      {
        id: "folder-registres-alger",
        title: "Alger",
        callNumber: "ALG-EC/ALG",
        documents: [
          {
            id: "doc-registre-alger-1898",
            title: "Registre annuel des actes",
            callNumber: "ALG-EC/ALG/1898-R01",
            kind: "register",
            date: "1898",
            language: ["fr"],
            physicalDescription: "1 registre relie, 240 pages",
            rights: "Acces encadre selon les delais applicables aux donnees personnelles.",
            pages: [
              {
                id: "page-registre-alger-1898-001",
                pageNumber: 1,
                label: "Page de titre",
                imageReference: "placeholder://ALG-EC-ALG-1898-R01-p001",
                preservationState: "stable",
              },
              {
                id: "page-registre-alger-1898-002",
                pageNumber: 2,
                label: "Table alphabetique",
                imageReference: "placeholder://ALG-EC-ALG-1898-R01-p002",
                preservationState: "stable",
              },
            ],
          },
        ],
      },
    ],
  },
];

export function getArchiveStats(collections: ArchiveCollection[]): ArchiveStats {
  return collections.reduce<ArchiveStats>(
    (stats, collection) => {
      const folderStats = countFolders(collection.folders);

      return {
        collections: stats.collections + 1,
        folders: stats.folders + folderStats.folders,
        documents: stats.documents + folderStats.documents,
        pages: stats.pages + folderStats.pages,
      };
    },
    { collections: 0, folders: 0, documents: 0, pages: 0 },
  );
}

function countFolders(folders: ArchiveFolder[]): Omit<ArchiveStats, "collections"> {
  return folders.reduce(
    (stats, folder) => {
      const childStats = folder.children ? countFolders(folder.children) : { folders: 0, documents: 0, pages: 0 };
      const documents = folder.documents ?? [];

      return {
        folders: stats.folders + 1 + childStats.folders,
        documents: stats.documents + documents.length + childStats.documents,
        pages:
          stats.pages +
          documents.reduce((total, document) => total + document.pages.length, 0) +
          childStats.pages,
      };
    },
    { folders: 0, documents: 0, pages: 0 },
  );
}
