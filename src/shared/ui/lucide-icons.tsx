import * as React from "react"
import type { LucideIcon, LucideProps } from "lucide-react"
import {
  AlertCircle,
  AlertTriangle,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  BarChart3,
  Bell,
  Bold,
  Briefcase,
  Calculator,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Chrome,
  Circle,
  CircleCheck,
  CircleDollarSign,
  CircleX,
  Clock,
  Coffee,
  Columns2,
  Computer,
  Copy,
  Download,
  Edit,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flower,
  Folder,
  FolderOpen,
  Github,
  GripVertical,
  Hammer,
  Heart,
  HelpCircle,
  Home,
  Info,
  Italic,
  LayoutGrid,
  LineChart,
  ListChecks,
  Loader,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Minus,
  Moon,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Printer,
  Radio,
  RefreshCw,
  Rocket,
  Rows2,
  Save,
  Search,
  Send,
  Settings,
  Settings2,
  SlidersHorizontal,
  Smile,
  Star,
  StopCircle,
  Sun,
  Trash,
  Trash2,
  Twitter,
  Underline,
  Upload,
  User,
  UserPlus,
  Users,
  Video,
  Wallet,
  X,
  XCircle,
} from "lucide-react"

const defaultIconProps: Partial<LucideProps> = {
  size: 24,
  strokeWidth: 1.75,
}

export type RemixiconComponentType = React.ForwardRefExoticComponent<
  LucideProps & React.RefAttributes<SVGSVGElement>
>

const withDefaults = (Icon: LucideIcon): RemixiconComponentType => {
  const Wrapped = React.forwardRef<SVGSVGElement, LucideProps>(
    (props, ref) => <Icon ref={ref} {...defaultIconProps} {...props} />,
  )
  Wrapped.displayName = Icon.displayName ?? Icon.name ?? "LucideIcon"
  return Wrapped
}

export const RiAddLine = withDefaults(Plus)
export const RiAlarmWarningLine = withDefaults(AlertTriangle)
export const RiAlertFill = withDefaults(AlertCircle)
export const RiAlignCenter = withDefaults(AlignCenter)
export const RiAlignLeft = withDefaults(AlignLeft)
export const RiAlignRight = withDefaults(AlignRight)
export const RiArchiveLine = withDefaults(Archive)
export const RiArrowDownLine = withDefaults(ArrowDown)
export const RiArrowDownSLine = withDefaults(ChevronDown)
export const RiArrowLeftDoubleLine = withDefaults(ChevronsLeft)
export const RiArrowLeftLine = withDefaults(ArrowLeft)
export const RiArrowLeftSLine = withDefaults(ChevronLeft)
export const RiArrowRightDoubleLine = withDefaults(ChevronsRight)
export const RiArrowRightLine = withDefaults(ArrowRight)
export const RiArrowRightSLine = withDefaults(ChevronRight)
export const RiArrowUpLine = withDefaults(ArrowUp)
export const RiArrowUpSLine = withDefaults(ChevronUp)
export const RiBarChartBoxLine = withDefaults(BarChart3)
export const RiBold = withDefaults(Bold)
export const RiBriefcaseLine = withDefaults(Briefcase)
export const RiCalculatorLine = withDefaults(Calculator)
export const RiCalendar2Fill = withDefaults(CalendarDays)
export const RiCalendar2Line = withDefaults(CalendarDays)
export const RiCalendarCheckLine = withDefaults(CalendarCheck)
export const RiCalendarEventLine = withDefaults(CalendarClock)
export const RiCalendarLine = withDefaults(Calendar)
export const RiCalendarScheduleLine = withDefaults(CalendarClock)
export const RiCheckboxBlankCircleLine = withDefaults(Circle)
export const RiCheckboxCircleFill = withDefaults(CheckCircle)
export const RiCheckboxCircleLine = withDefaults(CircleCheck)
export const RiCheckDoubleLine = withDefaults(CheckCheck)
export const RiCheckLine = withDefaults(Check)
export const RiCloseCircleFill = withDefaults(XCircle)
export const RiCloseCircleLine = withDefaults(CircleX)
export const RiCloseLine = withDefaults(X)
export const RiComputerLine = withDefaults(Computer)
export const RiCupLine = withDefaults(Coffee)
export const RiDeleteBin6Line = withDefaults(Trash2)
export const RiDeleteBinLine = withDefaults(Trash)
export const RiDownloadLine = withDefaults(Download)
export const RiDraggable = withDefaults(GripVertical)
export const RiEdit2Line = withDefaults(Edit2)
export const RiEditLine = withDefaults(Edit)
export const RiEqualizer2Line = withDefaults(SlidersHorizontal)
export const RiErrorWarningLine = withDefaults(AlertCircle)
export const RiExternalLinkLine = withDefaults(ExternalLink)
export const RiEyeFill = withDefaults(Eye)
export const RiEyeLine = withDefaults(Eye)
export const RiEyeOffFill = withDefaults(EyeOff)
export const RiEyeOffLine = withDefaults(EyeOff)
export const RiFileCopyLine = withDefaults(Copy)
export const RiFileList3Line = withDefaults(ListChecks)
export const RiFilePaperLine = withDefaults(FileText)
export const RiFileTextLine = withDefaults(FileText)
export const RiFlowerFill = withDefaults(Flower)
export const RiFolder3Line = withDefaults(FolderOpen)
export const RiFolderLine = withDefaults(Folder)
export const RiFundsBoxLine = withDefaults(Wallet)
export const RiGithubFill = withDefaults(Github)
export const RiGoogleFill = withDefaults(Chrome)
export const RiGroupLine = withDefaults(Users)
export const RiHammerLine = withDefaults(Hammer)
export const RiHeartFill = withDefaults(Heart)
export const RiHome2Line = withDefaults(Home)
export const RiInformationLine = withDefaults(Info)
export const RiItalic = withDefaults(Italic)
export const RiLayout2Line = withDefaults(Columns2)
export const RiLayoutGridLine = withDefaults(LayoutGrid)
export const RiLayoutRowLine = withDefaults(Rows2)
export const RiLineChartLine = withDefaults(LineChart)
export const RiListCheck2 = withDefaults(ListChecks)
export const RiLoader2Fill = withDefaults(Loader2)
export const RiLoader2Line = withDefaults(Loader2)
export const RiLoader4Line = withDefaults(Loader)
export const RiLoginBoxLine = withDefaults(LogIn)
export const RiLogoutBoxLine = withDefaults(LogOut)
export const RiMailLine = withDefaults(Mail)
export const RiMailSendLine = withDefaults(Send)
export const RiMapPinLine = withDefaults(MapPin)
export const RiMenuLine = withDefaults(Menu)
export const RiMessage3Line = withDefaults(MessageCircle)
export const RiMoneyDollarCircleLine = withDefaults(CircleDollarSign)
export const RiMoonLine = withDefaults(Moon)
export const RiMore2Fill = withDefaults(MoreVertical)
export const RiMoreFill = withDefaults(MoreHorizontal)
export const RiNotification3Line = withDefaults(Bell)
export const RiPencilLine = withDefaults(Pencil)
export const RiPrinterLine = withDefaults(Printer)
export const RiQuestionLine = withDefaults(HelpCircle)
export const RiRadioButtonFill = withDefaults(Radio)
export const RiRefreshLine = withDefaults(RefreshCw)
export const RiRocketLine = withDefaults(Rocket)
export const RiSave3Line = withDefaults(Save)
export const RiSaveLine = withDefaults(Save)
export const RiSearchLine = withDefaults(Search)
export const RiSettings3Line = withDefaults(Settings2)
export const RiSettings5Line = withDefaults(Settings)
export const RiStarFill = withDefaults(Star)
export const RiStarLine = withDefaults(Star)
export const RiStopCircleLine = withDefaults(StopCircle)
export const RiSubtractFill = withDefaults(Minus)
export const RiSunLine = withDefaults(Sun)
export const RiTeamLine = withDefaults(Users)
export const RiTimeLine = withDefaults(Clock)
export const RiTwitterFill = withDefaults(Twitter)
export const RiUnderline = withDefaults(Underline)
export const RiUploadLine = withDefaults(Upload)
export const RiUserAddLine = withDefaults(UserPlus)
export const RiUserLine = withDefaults(User)
export const RiUserSmileLine = withDefaults(Smile)
export const RiVerifiedBadgeFill = withDefaults(BadgeCheck)
export const RiVideoOnLine = withDefaults(Video)
export const RiWhatsappLine = withDefaults(Phone)
