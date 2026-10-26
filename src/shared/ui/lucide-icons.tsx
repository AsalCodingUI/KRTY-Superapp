import * as A from "@/components/icons"
import * as React from "react"
import type { LucideIcon, LucideProps } from "lucide-react"
import {
  BadgeCheck,
  List,
  ListOrdered,
  Megaphone,
  NotebookPen,
  Pin,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleX,
  Flower,
  Minus,
  Star,
  StopCircle,
  Video,
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
export const RiAlarmWarningLine =
  A.TriangleAlert as unknown as RemixiconComponentType
export const RiAlertFill = A.CircleAlert as unknown as RemixiconComponentType
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
export const RiCalculatorLine =
  A.Calculator as unknown as RemixiconComponentType
export const RiCalendar2Fill =
  A.CalendarDays as unknown as RemixiconComponentType
export const RiCalendar2Line =
  A.CalendarDays as unknown as RemixiconComponentType
export const RiCalendarCheckLine =
  A.CalendarCheck as unknown as RemixiconComponentType
export const RiCalendarEventLine =
  A.CalendarClock as unknown as RemixiconComponentType
export const RiCalendarLine =
  A.CalendarDays as unknown as RemixiconComponentType
export const RiCalendarScheduleLine =
  A.CalendarClock as unknown as RemixiconComponentType
export const RiCheckboxBlankCircleLine = /*#__PURE__*/ withDefaults(Circle)
export const RiStickyNoteLine = /*#__PURE__*/ withDefaults(NotebookPen)
export const RiPushpinLine = /*#__PURE__*/ withDefaults(Pin)
export const RiListUnordered = /*#__PURE__*/ withDefaults(List)
export const RiListOrdered = /*#__PURE__*/ withDefaults(ListOrdered)
export const RiMegaphoneLine = /*#__PURE__*/ withDefaults(Megaphone)
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
export const RiComputerLine = A.Monitor as unknown as RemixiconComponentType
export const RiCupLine = A.Coffee as unknown as RemixiconComponentType
export const RiDeleteBin6Line = A.Delete as unknown as RemixiconComponentType
export const RiDeleteBinLine = A.Delete as unknown as RemixiconComponentType
export const RiDownloadLine = A.Download as unknown as RemixiconComponentType
export const RiDraggable = A.GripVertical as unknown as RemixiconComponentType
export const RiEdit2Line = A.SquarePen as unknown as RemixiconComponentType
export const RiEditLine = A.SquarePen as unknown as RemixiconComponentType
export const RiEqualizer2Line =
  A.SlidersHorizontal as unknown as RemixiconComponentType
export const RiErrorWarningLine =
  A.CircleAlert as unknown as RemixiconComponentType
export const RiExternalLinkLine =
  A.ExternalLink as unknown as RemixiconComponentType
export const RiEyeFill = A.Eye as unknown as RemixiconComponentType
export const RiEyeLine = A.Eye as unknown as RemixiconComponentType
export const RiEyeOffFill = A.EyeOff as unknown as RemixiconComponentType
export const RiEyeOffLine = A.EyeOff as unknown as RemixiconComponentType
export const RiFileCopyLine = A.Copy as unknown as RemixiconComponentType
export const RiFileList3Line = A.ListChecks as unknown as RemixiconComponentType
export const RiBookOpenLine = A.BookOpen as unknown as RemixiconComponentType
export const RiBuildingLine = A.Building2 as unknown as RemixiconComponentType
export const RiFlowLine = A.Workflow as unknown as RemixiconComponentType
export const RiBankCardLine = A.CreditCard as unknown as RemixiconComponentType
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
export const RiInboxLine = A.Inbox as unknown as RemixiconComponentType
export const RiInformationLine = A.Info as unknown as RemixiconComponentType
export const RiItalic = A.Italic as unknown as RemixiconComponentType
export const RiLayout2Line = A.Columns2 as unknown as RemixiconComponentType
export const RiLayoutGridLine =
  A.LayoutGrid as unknown as RemixiconComponentType
export const RiLayoutRowLine = A.Rows2 as unknown as RemixiconComponentType
export const RiLineChartLine = A.ChartLine as unknown as RemixiconComponentType
export const RiListCheck2 = A.ListChecks as unknown as RemixiconComponentType
export const RiLoader2Fill = A.LoaderCircle as unknown as RemixiconComponentType
export const RiLoader2Line = A.LoaderCircle as unknown as RemixiconComponentType
export const RiLoader4Line = A.Loader as unknown as RemixiconComponentType
export const RiLoginBoxLine = A.LogIn as unknown as RemixiconComponentType
export const RiLogoutBoxLine = A.Logout as unknown as RemixiconComponentType
export const RiLockLine = A.Lock as unknown as RemixiconComponentType
export const RiMailLine = A.Mail as unknown as RemixiconComponentType
export const RiMailSendLine = A.Send as unknown as RemixiconComponentType
export const RiMapPinLine = A.MapPin as unknown as RemixiconComponentType
export const RiMenuLine = A.Menu as unknown as RemixiconComponentType
export const RiMessage3Line =
  A.MessageCircle as unknown as RemixiconComponentType
export const RiWalletLine = A.Wallet as unknown as RemixiconComponentType
export const RiMoneyDollarCircleLine =
  A.CircleDollarSign as unknown as RemixiconComponentType
export const RiMoonLine = A.Moon as unknown as RemixiconComponentType
export const RiMore2Fill = A.MoreVertical as unknown as RemixiconComponentType
export const RiMoreFill = A.MoreHorizontal as unknown as RemixiconComponentType
export const RiNotification3Line = A.Bell as unknown as RemixiconComponentType
export const RiPencilLine = A.SquarePen as unknown as RemixiconComponentType
export const RiPrinterLine = A.Printer as unknown as RemixiconComponentType
export const RiQuestionLine = A.CircleHelp as unknown as RemixiconComponentType
export const RiRadioButtonFill = A.Radio as unknown as RemixiconComponentType
export const RiRefreshLine = A.RefreshCW as unknown as RemixiconComponentType
export const RiRocketLine = A.Rocket as unknown as RemixiconComponentType
export const RiSave3Line = A.Save as unknown as RemixiconComponentType
export const RiSaveLine = A.Save as unknown as RemixiconComponentType
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
