import * as A from "@/components/icons"
import * as React from "react"
import type { LucideIcon, LucideProps } from "lucide-react"
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  BookOpen,
  Building2,
  Calculator,
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleX,
  Columns2,
  Computer,
  CreditCard,
  Flower,
  Info,
  ListChecks,
  Mail,
  Minus,
  MoreHorizontal,
  MoreVertical,
  Printer,
  Rows2,
  Save,
  Star,
  StopCircle,
  Video,
  Workflow,
  XCircle,
} from "lucide-react"

const defaultIconProps: Partial<LucideProps> = {
  size: 24,
  strokeWidth: 2,
}

export type RemixiconComponentType = React.ForwardRefExoticComponent<
  LucideProps & React.RefAttributes<SVGSVGElement>
>

const withDefaults = (Icon: LucideIcon): RemixiconComponentType => {
  const Wrapped = React.forwardRef<SVGSVGElement, LucideProps>((props, ref) => (
    <Icon ref={ref} {...defaultIconProps} {...props} />
  ))
  Wrapped.displayName = Icon.displayName ?? Icon.name ?? "LucideIcon"
  return Wrapped
}

export const RiAddLine = A.Plus as unknown as RemixiconComponentType
export const RiAlarmWarningLine = /*#__PURE__*/ withDefaults(AlertTriangle)
export const RiAlertFill = /*#__PURE__*/ withDefaults(AlertCircle)
export const RiAlignCenter = A.AlignCenter as unknown as RemixiconComponentType
export const RiAlignLeft = A.AlignLeft as unknown as RemixiconComponentType
export const RiAlignRight = A.AlignRight as unknown as RemixiconComponentType
export const RiArchiveLine = A.Archive as unknown as RemixiconComponentType
export const RiArrowDownLine = A.ArrowDown as unknown as RemixiconComponentType
export const RiArrowDownSLine =
  A.ChevronDown as unknown as RemixiconComponentType
export const RiArrowLeftDoubleLine = /*#__PURE__*/ withDefaults(ChevronsLeft)
export const RiArrowLeftLine = A.ArrowLeft as unknown as RemixiconComponentType
export const RiArrowLeftSLine =
  A.ChevronLeft as unknown as RemixiconComponentType
export const RiArrowRightDoubleLine = /*#__PURE__*/ withDefaults(ChevronsRight)
export const RiArrowRightLine =
  A.ArrowRight as unknown as RemixiconComponentType
export const RiArrowRightSLine =
  A.ChevronRight as unknown as RemixiconComponentType
export const RiArrowUpLine = A.ArrowUp as unknown as RemixiconComponentType
export const RiArrowUpSLine = A.ChevronUp as unknown as RemixiconComponentType
export const RiBarChartBoxLine =
  A.ChartColumnIncreasing as unknown as RemixiconComponentType
export const RiBold = A.Bold as unknown as RemixiconComponentType
export const RiBriefcaseLine =
  A.BriefcaseBusiness as unknown as RemixiconComponentType
export const RiCalculatorLine = /*#__PURE__*/ withDefaults(Calculator)
export const RiCalendar2Fill =
  A.CalendarDays as unknown as RemixiconComponentType
export const RiCalendar2Line =
  A.CalendarDays as unknown as RemixiconComponentType
export const RiCalendarCheckLine =
  A.CalendarCheck as unknown as RemixiconComponentType
export const RiCalendarEventLine = /*#__PURE__*/ withDefaults(CalendarClock)
export const RiCalendarLine =
  A.CalendarDays as unknown as RemixiconComponentType
export const RiCalendarScheduleLine = /*#__PURE__*/ withDefaults(CalendarClock)
export const RiCheckboxBlankCircleLine = /*#__PURE__*/ withDefaults(Circle)
export const RiCheckboxCircleFill =
  A.CircleCheck as unknown as RemixiconComponentType
export const RiCheckboxCircleLine =
  A.CircleCheck as unknown as RemixiconComponentType
export const RiCheckDoubleLine =
  A.CheckCheck as unknown as RemixiconComponentType
export const RiCheckLine = A.Check as unknown as RemixiconComponentType
export const RiCloseCircleFill = /*#__PURE__*/ withDefaults(XCircle)
export const RiCloseCircleLine = /*#__PURE__*/ withDefaults(CircleX)
export const RiCloseLine = A.X as unknown as RemixiconComponentType
export const RiComputerLine = /*#__PURE__*/ withDefaults(Computer)
export const RiCupLine = A.Coffee as unknown as RemixiconComponentType
export const RiDeleteBin6Line = A.Delete as unknown as RemixiconComponentType
export const RiDeleteBinLine = A.Delete as unknown as RemixiconComponentType
export const RiDownloadLine = A.Download as unknown as RemixiconComponentType
export const RiDraggable = A.GripVertical as unknown as RemixiconComponentType
export const RiEdit2Line = A.SquarePen as unknown as RemixiconComponentType
export const RiEditLine = A.SquarePen as unknown as RemixiconComponentType
export const RiEqualizer2Line =
  A.SlidersHorizontal as unknown as RemixiconComponentType
export const RiErrorWarningLine = /*#__PURE__*/ withDefaults(AlertCircle)
export const RiExternalLinkLine =
  A.ExternalLink as unknown as RemixiconComponentType
export const RiEyeFill = A.Eye as unknown as RemixiconComponentType
export const RiEyeLine = A.Eye as unknown as RemixiconComponentType
export const RiEyeOffFill = A.EyeOff as unknown as RemixiconComponentType
export const RiEyeOffLine = A.EyeOff as unknown as RemixiconComponentType
export const RiFileCopyLine = A.Copy as unknown as RemixiconComponentType
export const RiFileList3Line = /*#__PURE__*/ withDefaults(ListChecks)
export const RiBookOpenLine = /*#__PURE__*/ withDefaults(BookOpen)
export const RiBuildingLine = /*#__PURE__*/ withDefaults(Building2)
export const RiFlowLine = /*#__PURE__*/ withDefaults(Workflow)
export const RiBankCardLine = /*#__PURE__*/ withDefaults(CreditCard)
export const RiFilePaperLine = A.FileText as unknown as RemixiconComponentType
export const RiFileTextLine = A.FileText as unknown as RemixiconComponentType
export const RiFlowerFill = /*#__PURE__*/ withDefaults(Flower)
export const RiFolder3Line = A.FolderOpen as unknown as RemixiconComponentType
export const RiFolderLine = A.FolderOpen as unknown as RemixiconComponentType
export const RiFundsBoxLine = A.Wallet as unknown as RemixiconComponentType
export const RiGithubFill = A.Github as unknown as RemixiconComponentType
export const RiGoogleFill = A.Chrome as unknown as RemixiconComponentType
export const RiGroupLine = A.Users as unknown as RemixiconComponentType
export const RiHammerLine = A.Hammer as unknown as RemixiconComponentType
export const RiHeartFill = A.Heart as unknown as RemixiconComponentType
export const RiHome2Line = A.Home as unknown as RemixiconComponentType
export const RiInformationLine = /*#__PURE__*/ withDefaults(Info)
export const RiItalic = A.Italic as unknown as RemixiconComponentType
export const RiLayout2Line = /*#__PURE__*/ withDefaults(Columns2)
export const RiLayoutGridLine =
  A.LayoutGrid as unknown as RemixiconComponentType
export const RiLayoutRowLine = /*#__PURE__*/ withDefaults(Rows2)
export const RiLineChartLine = A.ChartLine as unknown as RemixiconComponentType
export const RiListCheck2 = /*#__PURE__*/ withDefaults(ListChecks)
export const RiLoader2Fill = A.LoaderCircle as unknown as RemixiconComponentType
export const RiLoader2Line = A.LoaderCircle as unknown as RemixiconComponentType
export const RiLoader4Line = A.Loader as unknown as RemixiconComponentType
export const RiLoginBoxLine = A.LogIn as unknown as RemixiconComponentType
export const RiLogoutBoxLine = A.Logout as unknown as RemixiconComponentType
export const RiLockLine = A.Lock as unknown as RemixiconComponentType
export const RiMailLine = /*#__PURE__*/ withDefaults(Mail)
export const RiMailSendLine = A.Send as unknown as RemixiconComponentType
export const RiMapPinLine = A.MapPin as unknown as RemixiconComponentType
export const RiMenuLine = A.Menu as unknown as RemixiconComponentType
export const RiMessage3Line =
  A.MessageCircle as unknown as RemixiconComponentType
export const RiWalletLine = A.Wallet as unknown as RemixiconComponentType
export const RiMoneyDollarCircleLine =
  A.CircleDollarSign as unknown as RemixiconComponentType
export const RiMoonLine = A.Moon as unknown as RemixiconComponentType
export const RiMore2Fill = /*#__PURE__*/ withDefaults(MoreVertical)
export const RiMoreFill = /*#__PURE__*/ withDefaults(MoreHorizontal)
export const RiNotification3Line = A.Bell as unknown as RemixiconComponentType
export const RiPencilLine = A.SquarePen as unknown as RemixiconComponentType
export const RiPrinterLine = /*#__PURE__*/ withDefaults(Printer)
export const RiQuestionLine = A.CircleHelp as unknown as RemixiconComponentType
export const RiRadioButtonFill = A.Radio as unknown as RemixiconComponentType
export const RiRefreshLine = A.RefreshCW as unknown as RemixiconComponentType
export const RiRocketLine = A.Rocket as unknown as RemixiconComponentType
export const RiSave3Line = /*#__PURE__*/ withDefaults(Save)
export const RiSaveLine = /*#__PURE__*/ withDefaults(Save)
export const RiSearchLine = A.Search as unknown as RemixiconComponentType
export const RiSettings3Line =
  A.SlidersHorizontal as unknown as RemixiconComponentType
export const RiSettings5Line = A.Settings as unknown as RemixiconComponentType
export const RiStarFill = /*#__PURE__*/ withDefaults(Star)
export const RiStarLine = /*#__PURE__*/ withDefaults(Star)
export const RiStopCircleLine = /*#__PURE__*/ withDefaults(StopCircle)
export const RiSubtractFill = /*#__PURE__*/ withDefaults(Minus)
export const RiSunLine = A.Sun as unknown as RemixiconComponentType
export const RiTeamLine = A.Users as unknown as RemixiconComponentType
export const RiTimeLine = A.Clock as unknown as RemixiconComponentType
export const RiTwitterFill = A.Twitter as unknown as RemixiconComponentType
export const RiUnderline = A.Underline as unknown as RemixiconComponentType
export const RiUploadLine = A.Upload as unknown as RemixiconComponentType
export const RiUserAddLine = A.UserPlus as unknown as RemixiconComponentType
export const RiUserLine = A.User as unknown as RemixiconComponentType
export const RiUserSmileLine = A.Smile as unknown as RemixiconComponentType
export const RiVerifiedBadgeFill = /*#__PURE__*/ withDefaults(BadgeCheck)
export const RiVideoOnLine = /*#__PURE__*/ withDefaults(Video)
export const RiWhatsappLine = A.Phone as unknown as RemixiconComponentType
