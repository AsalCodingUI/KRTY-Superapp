import * as A from "@/components/icons"
import { filled, type Icon } from "@/components/icons"

/**
 * Legacy Remix-style names (Ri*Line / Ri*Fill), kept so older code keeps
 * working: each is one of the app's icons (@/components/icons, Reicon);
 * `*Fill` names are the filled set. New code imports from
 * @/components/icons instead (docs/ui/icons.md).
 */
export type RemixiconComponentType = Icon

export const RiAddLine = A.Plus
export const RiAlarmWarningLine = A.TriangleAlert
export const RiAlertFill = /*#__PURE__*/ filled(A.CircleAlert, "RiAlertFill")
export const RiAlignCenter = A.AlignCenter
export const RiAlignLeft = A.AlignLeft
export const RiAlignRight = A.AlignRight
export const RiArchiveLine = A.Archive
export const RiArrowDownLine = A.ArrowDown
export const RiArrowDownSLine = A.ChevronDown
export const RiArrowLeftDoubleLine = A.ChevronsLeft
export const RiArrowLeftLine = A.ArrowLeft
export const RiArrowLeftSLine = A.ChevronLeft
export const RiArrowRightDoubleLine = A.ChevronsRight
export const RiArrowRightLine = A.ArrowRight
export const RiArrowRightSLine = A.ChevronRight
export const RiArrowUpLine = A.ArrowUp
export const RiArrowUpSLine = A.ChevronUp
export const RiBarChartBoxLine = A.ChartColumnIncreasing
export const RiBold = A.Bold
export const RiBriefcaseLine = A.BriefcaseBusiness
export const RiCalculatorLine = A.Calculator
export const RiCalendar2Fill = /*#__PURE__*/ filled(
  A.CalendarDays,
  "RiCalendar2Fill",
)
export const RiCalendar2Line = A.CalendarDays
export const RiCalendarCheckLine = A.CalendarCheck
export const RiCalendarEventLine = A.CalendarClock
export const RiCalendarLine = A.CalendarDays
export const RiCalendarScheduleLine = A.CalendarClock
export const RiCheckboxBlankCircleLine = A.Circle
export const RiStickyNoteLine = A.NotebookPen
export const RiPushpinLine = A.Pin
export const RiListUnordered = A.List
export const RiListOrdered = A.ListOrdered
export const RiMegaphoneLine = A.Megaphone
export const RiCheckboxCircleFill = /*#__PURE__*/ filled(
  A.CircleCheck,
  "RiCheckboxCircleFill",
)
export const RiCheckboxCircleLine = A.CircleCheck
export const RiCheckDoubleLine = A.CheckCheck
export const RiCheckLine = A.Check
export const RiCloseCircleFill = /*#__PURE__*/ filled(
  A.XCircle,
  "RiCloseCircleFill",
)
export const RiCloseCircleLine = A.CircleX
export const RiCloseLine = A.X
export const RiComputerLine = A.Monitor
export const RiCupLine = A.Coffee
export const RiDeleteBin6Line = A.Delete
export const RiDeleteBinLine = A.Delete
export const RiDownloadLine = A.Download
export const RiDraggable = A.GripVertical
export const RiEdit2Line = A.SquarePen
export const RiEditLine = A.SquarePen
export const RiEqualizer2Line = A.SlidersHorizontal
export const RiErrorWarningLine = A.CircleAlert
export const RiExternalLinkLine = A.ExternalLink
export const RiEyeFill = /*#__PURE__*/ filled(A.Eye, "RiEyeFill")
export const RiEyeLine = A.Eye
export const RiEyeOffFill = /*#__PURE__*/ filled(A.EyeOff, "RiEyeOffFill")
export const RiEyeOffLine = A.EyeOff
export const RiFileCopyLine = A.Copy
export const RiFileList3Line = A.ListChecks
export const RiBookOpenLine = A.BookOpen
export const RiBuildingLine = A.Building2
export const RiFlowLine = A.Workflow
export const RiBankCardLine = A.CreditCard
export const RiFilePaperLine = A.FileText
export const RiFileTextLine = A.FileText
export const RiFlowerFill = /*#__PURE__*/ filled(A.Flower, "RiFlowerFill")
export const RiFolder3Line = A.FolderOpen
export const RiFolderLine = A.FolderOpen
export const RiFundsBoxLine = A.Wallet
export const RiGroupLine = A.Users
export const RiHammerLine = A.Hammer
export const RiHeartFill = /*#__PURE__*/ filled(A.Heart, "RiHeartFill")
export const RiHome2Line = A.Home
export const RiInboxLine = A.Inbox
export const RiInformationLine = A.Info
export const RiItalic = A.Italic
export const RiLayout2Line = A.Columns2
export const RiLayoutGridLine = A.LayoutGrid
export const RiLayoutRowLine = A.Rows2
export const RiLineChartLine = A.ChartLine
export const RiListCheck2 = A.ListChecks
export const RiLoader2Fill = /*#__PURE__*/ filled(
  A.LoaderCircle,
  "RiLoader2Fill",
)
export const RiLoader2Line = A.LoaderCircle
export const RiLoader4Line = A.Loader
export const RiLoginBoxLine = A.LogIn
export const RiLogoutBoxLine = A.Logout
export const RiLockLine = A.Lock
export const RiMailLine = A.Mail
export const RiMailSendLine = A.Send
export const RiMapPinLine = A.MapPin
export const RiMenuLine = A.Menu
export const RiMessage3Line = A.MessageCircle
export const RiWalletLine = A.Wallet
export const RiMoneyDollarCircleLine = A.CircleDollarSign
export const RiMoonLine = A.Moon
export const RiMore2Fill = /*#__PURE__*/ filled(A.MoreVertical, "RiMore2Fill")
export const RiMoreFill = /*#__PURE__*/ filled(A.MoreHorizontal, "RiMoreFill")
export const RiNotification3Line = A.Bell
export const RiPencilLine = A.SquarePen
export const RiPrinterLine = A.Printer
export const RiQuestionLine = A.CircleHelp
export const RiRadioButtonFill = /*#__PURE__*/ filled(
  A.Radio,
  "RiRadioButtonFill",
)
export const RiRefreshLine = A.RefreshCW
export const RiRocketLine = A.Rocket
export const RiSave3Line = A.Save
export const RiSaveLine = A.Save
export const RiSearchLine = A.Search
export const RiSettings3Line = A.SlidersHorizontal
export const RiSettings5Line = A.Settings
export const RiStarFill = /*#__PURE__*/ filled(A.Star, "RiStarFill")
export const RiStarLine = A.Star
export const RiStopCircleLine = A.StopCircle
export const RiSubtractFill = /*#__PURE__*/ filled(A.Minus, "RiSubtractFill")
export const RiSunLine = A.Sun
export const RiTeamLine = A.Users
export const RiTimeLine = A.Clock
export const RiUploadLine = A.Upload
export const RiUserAddLine = A.UserPlus
export const RiUserLine = A.User
export const RiUserSmileLine = A.Smile
export const RiVerifiedBadgeFill = /*#__PURE__*/ filled(
  A.BadgeCheck,
  "RiVerifiedBadgeFill",
)
export const RiVideoOnLine = A.Video
export const RiWhatsappLine = A.Phone
export const RiGoogleFill = /*#__PURE__*/ filled(A.Chrome, "RiGoogleFill")
export const RiUnderline = A.Underline
