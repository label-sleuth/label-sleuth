import { TypedActionCreator } from "@reduxjs/toolkit/dist/mapBuilders";
import { LabelTypesEnum, PanelIdsEnum } from "./const";
interface ReducerObj {
  action: TypedActionCreator;
  reducer: (state: any, action: any) => void;
}

interface CreatedWorkspace {
  dataset_name: string;
  first_document_id: string;
  workspace_id: string;
}

interface CreateWorkspaceBody {
  dataset_id: string;
  workspace_id: string;
}

interface CheckStatusResponse {
  progress: { all: number };
  labeling_counts: { true: number; false: number };
}

interface UnparsedModel {
  changed_fraction?: number;
  creation_epoch: number;
  iteration: number;
  iteration_status: string;
  model_metadata: {
    train_counts: { [key: string]: number };
  };
  model_status: string;
  model_type: string;
  positive_fraction: number;
  total_positive_count?: number;
  estimated_precision: number;
}

interface UnparsedElement {
  user_labels: { [key: string]: boolean };
  model_predictions: { [key: string]: boolean };
  docid: string;
  id: string;
  text: string;
}

interface Element {
  id: string;
  docId: string;
  userLabel: LabelTypesEnum;
  modelPrediction: LabelTypesEnum;
  text: string;
}

interface ElementsDict {
  [key: string]: Element;
}

interface PanelState {
  elements: ElementsDict | null;
  hitCount: number | null;
  page: number;
}

interface ContractingLabelsPanelState extends PanelState {
  pairs: [string, string][];
}

interface PositivePredictionsPanelState extends PanelState {
  refetch: boolean;
}

interface EvaluationPanelState extends PanelState {
  isInProgress: boolean;
  lastScore: number | null;
  scoreModelVersion: number | null;
  initialElements: ElementsDict;
}
interface SearchPanelState extends PanelState {
  input: string | null;
  lastSearchString: string | null;
  hitCountWithDuplicates: number | null;
}

interface FocusedElement {
  id: string | null;
  DOMKey: string | null;
  hackyToggle: boolean;
  highlight: boolean;
}

interface ErrorSliceState {
  errorMessage: string | null;
}

interface AddedDataset {
  dataset_name: string;
  num_docs: number;
  num_sentences: number;
  workspaces_to_update: string[];
}

interface Dataset {
  dataset_id: string;
}

interface WorkspaceConfigSliceState {
  datasetAdded: AddedDataset | null;
  isWorkspaceAdded: boolean;
  workspaces: string[];
  active_workspace: string;
  datasets: Dataset[];
  loading: boolean;
  isDocumentAdded: boolean;
  uploadingDataset: boolean;
}

interface PanelsSliceState {
  panels: {
    loading: { [key: string]: boolean };
    activePanelId: PanelIdsEnum;
    focusedElement: FocusedElement;
    focusedSidebarElement: {
      index: number | null;
      scrollIntoViewOnChange: boolean;
    };
    refetch: boolean;
    panels: {
      [PanelIdsEnum.MAIN_PANEL]: PanelState;
      [PanelIdsEnum.SEARCH]: SearchPanelState;
      [PanelIdsEnum.LABEL_NEXT]: PanelState;
      [PanelIdsEnum.POSITIVE_PREDICTIONS]: PositivePredictionsPanelState;
      [PanelIdsEnum.POSITIVE_LABELS]: PanelState;
      [PanelIdsEnum.SUSPICIOUS_LABELS]: PanelState;
      [PanelIdsEnum.CONTRADICTING_LABELS]: ContractingLabelsPanelState;
      [PanelIdsEnum.EVALUATION]: EvaluationPanelState;
    };
  };
}

interface FeatureFlagsSliceState {
  authenticationEnabled: boolean;
  loading: boolean;
  fetched: boolean;
  sidebarPanelElementsPerPage: number;
  mainPanelElementsPerPage: number;
  rightToLeft: boolean;
}

interface PaginationParam {
  startIndex: number;
  elementsPerPage: number | null;
}

interface EditCategoryResponse {
  category_id: string;
  category_name: string;
  category_description: string;
  workspace_id: string;
}

interface Category {
  category_id: number; // Rename to categoryId
  category_name: string; // Rename to categoryId
}

interface CategorySliceState {
  categories: Category[];
  curCategory: number | null;
  deletingCategory: boolean;
}

interface Document {
  documentId: string;
}

interface DocumentSliceState {
  documents: Document[];
  curDocIndex: null | number;
}

interface UploadedLabels {
  categories: { category_id: number; counter: number }[];
  categoriesCreated: string[];
  total: number;
  contracticting_labels_info: {
    elements: string[];
  };
}

interface LabelSliceState {
  uploadedLabels: UploadedLabels | null;
  uploadingLabels: boolean;
  downloadingLabels: boolean;
  labelCount: {
    pos: number;
    neg: number;
    weakPos: number;
    weakNeg: number;
  };
}

interface LabelingCountsUnparsed {
  true?: number;
  false?: number;
  weak_true?: number;
  weak_false?: number;
}

interface ModelSliceState {
  modelUpdateProgress: number;
  downloadingModel: boolean;
  lastModelFailed: boolean;
  nextModelShouldBeTraining: boolean;
  modelVersion: number | null;
  modelStatusCheckAttempts: number;
}

type WorkspaceState = CategorySliceState &
  PanelsSliceState &
  DocumentSliceState &
  CategorySliceState &
  LabelSliceState &
  ModelSliceState & {
    systemVersion: string | null;
    isSearchActive: boolean;
    errorMessage: string | null;
  };

interface FetchPanelElementsParams {
  pagination?: PaginationParam;
  docId?: string;
  useLastSearchString?: boolean;
}
