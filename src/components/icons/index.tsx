"use client"

/**
 * The app's icons: Reicon (https://reicon.dev, MIT), in DEFAULT_WEIGHT
 * (Outline) unless an icon passes `weight`. Import
 * every icon from here (never from "reicon-react" or "lucide-react"
 * directly), so the icon set stays one decision. Names keep the app's
 * existing (lucide-style) names; the right-hand side is the Reicon glyph.
 * A few glyphs Reicon doesn't have (editor headings, tables, grips, some
 * brands) come from lucide, marked below. See docs/ui/icons.md.
 */

import * as React from "react"
import type { IconProps as ReiconProps } from "reicon-react"
import type { LucideIcon as LucideSource } from "lucide-react"

import RAddressCard from "reicon-react/icons/AddressCard"
import RAlertCircle from "reicon-react/icons/AlertCircle"
import RAlertTriangle from "reicon-react/icons/AlertTriangle"
import RAngleDownSquare from "reicon-react/icons/AngleDownSquare"
import RAnglesLeft from "reicon-react/icons/AnglesLeft"
import RAnglesRight from "reicon-react/icons/AnglesRight"
import RArchive from "reicon-react/icons/Archive"
import RArchiveDown from "reicon-react/icons/ArchiveDown"
import RArrowDown from "reicon-react/icons/ArrowDown"
import RArrowLeft from "reicon-react/icons/ArrowLeft"
import RArrowRight from "reicon-react/icons/ArrowRight"
import RArrowSwapHorizontal from "reicon-react/icons/ArrowSwapHorizontal"
import RArrowToTopRight from "reicon-react/icons/ArrowToTopRight"
import RArrowUp from "reicon-react/icons/ArrowUp"
import RArrowUpRight from "reicon-react/icons/ArrowUpRight"
import RAtSign from "reicon-react/icons/AtSign"
import RBell from "reicon-react/icons/Bell"
import RBookOpen from "reicon-react/icons/BookOpen"
import RBriefcase from "reicon-react/icons/Briefcase"
import RBuilding2 from "reicon-react/icons/Building2"
import RBullhorn from "reicon-react/icons/Bullhorn"
import RCalculator from "reicon-react/icons/Calculator"
import RCalendar from "reicon-react/icons/Calendar"
import RCalendarCheck from "reicon-react/icons/CalendarCheck"
import RCalendarDate from "reicon-react/icons/CalendarDate"
import RCalendarDays from "reicon-react/icons/CalendarDays"
import RCalendarPlus from "reicon-react/icons/CalendarPlus"
import RCalendarRemove from "reicon-react/icons/CalendarRemove"
import RCalendarSearch from "reicon-react/icons/CalendarSearch"
import RCalendarX from "reicon-react/icons/CalendarX"
import RCamera from "reicon-react/icons/Camera"
import RCategory from "reicon-react/icons/Category"
import RChartBar from "reicon-react/icons/ChartBar"
import RChartBarTrendUp from "reicon-react/icons/ChartBarTrendUp"
import RChartLine from "reicon-react/icons/ChartLine"
import RChartPie from "reicon-react/icons/ChartPie"
import RCheck from "reicon-react/icons/Check"
import RCheckCircle from "reicon-react/icons/CheckCircle"
import RCheckListSquare from "reicon-react/icons/CheckListSquare"
import RCheckRead from "reicon-react/icons/CheckRead"
import RChecklist from "reicon-react/icons/Checklist"
import RChevronDown from "reicon-react/icons/ChevronDown"
import RChevronExpandY from "reicon-react/icons/ChevronExpandY"
import RChevronLeft from "reicon-react/icons/ChevronLeft"
import RChevronRight from "reicon-react/icons/ChevronRight"
import RChevronUp from "reicon-react/icons/ChevronUp"
import RChrome from "reicon-react/icons/Chrome"
import RClipboardAdd from "reicon-react/icons/ClipboardAdd"
import RClipboardCheck from "reicon-react/icons/ClipboardCheck"
import RClipboardImport from "reicon-react/icons/ClipboardImport"
import RClipboardText from "reicon-react/icons/ClipboardText"
import RClock from "reicon-react/icons/Clock"
import RCloseCircle from "reicon-react/icons/CloseCircle"
import RCloud from "reicon-react/icons/Cloud"
import RCloudCross from "reicon-react/icons/CloudCross"
import RCloudUpload from "reicon-react/icons/CloudUpload"
import RCode from "reicon-react/icons/Code"
import RCode2 from "reicon-react/icons/Code2"
import RCoffee from "reicon-react/icons/Coffee"
import RCopy from "reicon-react/icons/Copy"
import RCreditCard from "reicon-react/icons/CreditCard"
import RCursor from "reicon-react/icons/Cursor"
import RDanger from "reicon-react/icons/Danger"
import RDocumentCopy from "reicon-react/icons/DocumentCopy"
import RDocumentText from "reicon-react/icons/DocumentText"
import RDollarCircle from "reicon-react/icons/DollarCircle"
import RDownload from "reicon-react/icons/Download"
import REdit2 from "reicon-react/icons/Edit2"
import RElement from "reicon-react/icons/Element"
import REnvelope from "reicon-react/icons/Envelope"
import REnvelopeOpen from "reicon-react/icons/EnvelopeOpen"
import REraser from "reicon-react/icons/Eraser"
import RExitFullscreen from "reicon-react/icons/ExitFullscreen"
import REye from "reicon-react/icons/Eye"
import REyeOff from "reicon-react/icons/EyeOff"
import RFaceSmile from "reicon-react/icons/FaceSmile"
import RFile from "reicon-react/icons/File"
import RFilePlus from "reicon-react/icons/FilePlus"
import RFileText from "reicon-react/icons/FileText"
import RFiles from "reicon-react/icons/Files"
import RFilter from "reicon-react/icons/Filter"
import RFilterSearch from "reicon-react/icons/FilterSearch"
import RFlag from "reicon-react/icons/Flag"
import RFolder from "reicon-react/icons/Folder"
import RFolderMove from "reicon-react/icons/FolderMove"
import RFolderOpen from "reicon-react/icons/FolderOpen"
import RFolderPlus from "reicon-react/icons/FolderPlus"
import RForbidden from "reicon-react/icons/Forbidden"
import RFullscreen from "reicon-react/icons/Fullscreen"
import RGallery from "reicon-react/icons/Gallery"
import RGalleryWide from "reicon-react/icons/GalleryWide"
import RGauge from "reicon-react/icons/Gauge"
import RGlobe from "reicon-react/icons/Globe"
import RHashtag from "reicon-react/icons/Hashtag"
import RHeart from "reicon-react/icons/Heart"
import RHelpCircle from "reicon-react/icons/HelpCircle"
import RHierarchy from "reicon-react/icons/Hierarchy"
import RHome from "reicon-react/icons/Home"
import RImage from "reicon-react/icons/Image"
import RImagePlus from "reicon-react/icons/ImagePlus"
import RImageUp from "reicon-react/icons/ImageUp"
import RInbox from "reicon-react/icons/Inbox"
import RInfinite from "reicon-react/icons/Infinite"
import RInfoCircle from "reicon-react/icons/InfoCircle"
import RKanban from "reicon-react/icons/Kanban"
import RLayers from "reicon-react/icons/Layers"
import RLeaf from "reicon-react/icons/Leaf"
import RLink from "reicon-react/icons/Link"
import RLink2 from "reicon-react/icons/Link2"
import RLinkOff from "reicon-react/icons/LinkOff"
import RList from "reicon-react/icons/List"
import RListArrowUp from "reicon-react/icons/ListArrowUp"
import RLoader from "reicon-react/icons/Loader"
import RLock from "reicon-react/icons/Lock"
import RLogin from "reicon-react/icons/Login"
import RLogout from "reicon-react/icons/Logout"
import RMapPoint from "reicon-react/icons/MapPoint"
import RMaximize from "reicon-react/icons/Maximize"
import RMenu from "reicon-react/icons/Menu"
import RMessageCircle from "reicon-react/icons/MessageCircle"
import RMessageSquare from "reicon-react/icons/MessageSquare"
import RMinus from "reicon-react/icons/Minus"
import RMobile from "reicon-react/icons/Mobile"
import RMonitor from "reicon-react/icons/Monitor"
import RMoon from "reicon-react/icons/Moon"
import RMore from "reicon-react/icons/More"
import RMoreH from "reicon-react/icons/MoreH"
import RNotebook from "reicon-react/icons/Notebook"
import ROrderedList from "reicon-react/icons/OrderedList"
import RPalette from "reicon-react/icons/Palette"
import RPaperclip from "reicon-react/icons/Paperclip"
import RPause from "reicon-react/icons/Pause"
import RPen from "reicon-react/icons/Pen"
import RPenSquare from "reicon-react/icons/PenSquare"
import RPhone from "reicon-react/icons/Phone"
import RPin from "reicon-react/icons/Pin"
import RPlay from "reicon-react/icons/Play"
import RPlus from "reicon-react/icons/Plus"
import RPower from "reicon-react/icons/Power"
import RPrinter from "reicon-react/icons/Printer"
import RQuoteDown from "reicon-react/icons/QuoteDown"
import RQuoteUp from "reicon-react/icons/QuoteUp"
import RRadio from "reicon-react/icons/Radio"
import RRecordCircle from "reicon-react/icons/RecordCircle"
import RRedo from "reicon-react/icons/Redo"
import RRefresh from "reicon-react/icons/Refresh"
import RRepeat from "reicon-react/icons/Repeat"
import RRocket from "reicon-react/icons/Rocket"
import RRotateLeft from "reicon-react/icons/RotateLeft"
import RRotateRight from "reicon-react/icons/RotateRight"
import RRuler from "reicon-react/icons/Ruler"
import RRulerPen from "reicon-react/icons/RulerPen"
import RSave from "reicon-react/icons/Save"
import RScissors from "reicon-react/icons/Scissors"
import RScroll from "reicon-react/icons/Scroll"
import RSearch from "reicon-react/icons/Search"
import RSearchFavorite from "reicon-react/icons/SearchFavorite"
import RSend from "reicon-react/icons/Send"
import RSettings from "reicon-react/icons/Settings"
import RSettings2 from "reicon-react/icons/Settings2"
import RShieldCheck from "reicon-react/icons/ShieldCheck"
import RSidebarLeft from "reicon-react/icons/SidebarLeft"
import RSledgehammer from "reicon-react/icons/Sledgehammer"
import RSliders from "reicon-react/icons/Sliders"
import RSparkles from "reicon-react/icons/Sparkles"
import RStar from "reicon-react/icons/Star"
import RStickynote from "reicon-react/icons/Stickynote"
import RStop from "reicon-react/icons/Stop"
import RStopCircle from "reicon-react/icons/StopCircle"
import RSun from "reicon-react/icons/Sun"
import RSunrise from "reicon-react/icons/Sunrise"
import RTablet from "reicon-react/icons/Tablet"
import RTag from "reicon-react/icons/Tag"
import RTarget from "reicon-react/icons/Target"
import RTextBold from "reicon-react/icons/TextBold"
import RTextInput from "reicon-react/icons/TextInput"
import RTextItalic from "reicon-react/icons/TextItalic"
import RTextUnderline from "reicon-react/icons/TextUnderline"
import RTextalignCenter from "reicon-react/icons/TextalignCenter"
import RTextalignLeft from "reicon-react/icons/TextalignLeft"
import RTextalignRight from "reicon-react/icons/TextalignRight"
import RTimer from "reicon-react/icons/Timer"
import RToggleOn from "reicon-react/icons/ToggleOn"
import RTranslate from "reicon-react/icons/Translate"
import RTrash from "reicon-react/icons/Trash"
import RTrash2 from "reicon-react/icons/Trash2"
import RUndo from "reicon-react/icons/Undo"
import RUpload from "reicon-react/icons/Upload"
import RUser from "reicon-react/icons/User"
import RUserAdd from "reicon-react/icons/UserAdd"
import RUserCheck from "reicon-react/icons/UserCheck"
import RUserCircle from "reicon-react/icons/UserCircle"
import RUserX from "reicon-react/icons/UserX"
import RUsers from "reicon-react/icons/Users"
import RUsers2 from "reicon-react/icons/Users2"
import RVerified from "reicon-react/icons/Verified"
import RVideo from "reicon-react/icons/Video"
import RVolumeX from "reicon-react/icons/VolumeX"
import RWallet from "reicon-react/icons/Wallet"
import RWandSparkle from "reicon-react/icons/WandSparkle"
import RWifiOff from "reicon-react/icons/WifiOff"
import RWindow from "reicon-react/icons/Window"
import RX from "reicon-react/icons/X"
import RXCircle from "reicon-react/icons/XCircle"
import {
  ChevronsDownUp as LChevronsDownUp,
  ChevronsUp as LChevronsUp,
  Circle as LCircle,
  CircleDashed as LCircleDashed,
  Columns2 as LColumns2,
  Columns3 as LColumns3,
  CornerDownLeft as LCornerDownLeft,
  CornerDownRight as LCornerDownRight,
  CornerLeftUp as LCornerLeftUp,
  Github as LGithub,
  GripHorizontal as LGripHorizontal,
  GripVertical as LGripVertical,
  Heading as LHeading,
  Heading1 as LHeading1,
  Heading2 as LHeading2,
  Heading3 as LHeading3,
  Pilcrow as LPilcrow,
  Rows2 as LRows2,
  SeparatorHorizontal as LSeparatorHorizontal,
  Split as LSplit,
  Square as LSquare,
  Strikethrough as LStrikethrough,
  Table as LTable,
  Table2 as LTable2,
  Twitter as LTwitter,
} from "lucide-react"

export type IconWeight = "Outline" | "Filled"

/** The app's icon weight: the one switch for the whole icon set. A single
 *  icon can still pass `weight` (e.g. "Outline" next to filled ones). */
export const DEFAULT_WEIGHT: IconWeight = "Outline"

export type IconProps = Omit<ReiconProps, "weight" | "strokeWidth"> & {
  /** "Filled" for the filled set (e.g. the active nav item). */
  weight?: IconWeight
  /** Ignored: Reicon's own stroke is the standard (a custom one makes
   *  every icon render an extra mask, which is heavy). */
  strokeWidth?: number | string
  /** Ignored (lucide only). */
  absoluteStrokeWidth?: boolean
}

export type Icon = React.ForwardRefExoticComponent<
  IconProps & React.RefAttributes<SVGSVGElement>
>
/** Old names, kept so existing type imports keep working. */
export type LucideIcon = Icon
export type LucideProps = IconProps

type ReiconSource = React.ForwardRefExoticComponent<
  ReiconProps & React.RefAttributes<SVGSVGElement>
>

/** Decorative unless labelled, like lucide; 24px unless a size-* class
 *  (the usual way) sets it. */
function a11y(props: IconProps) {
  const labelled = props["aria-label"] || props["aria-labelledby"]
  return labelled ? {} : { "aria-hidden": true as const }
}

function reicon(Source: ReiconSource, name: string, filled = false): Icon {
  const C = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
    { weight, strokeWidth: _s, absoluteStrokeWidth: _a, ...props },
    ref,
  ) {
    return (
      <Source
        ref={ref}
        {...a11y(props)}
        {...props}
        weight={weight ?? (filled ? "Filled" : DEFAULT_WEIGHT)}
      />
    )
  })
  C.displayName = name
  return C
}

function lucide(Source: LucideSource, name: string): Icon {
  const C = React.forwardRef<SVGSVGElement, IconProps>(function Icon(
    { weight: _w, strokeWidth: _s, absoluteStrokeWidth: _a, color, ...props },
    ref,
  ) {
    return (
      <Source
        ref={ref}
        strokeWidth={1.5}
        color={color}
        {...a11y(props)}
        {...(props as React.ComponentProps<LucideSource>)}
      />
    )
  })
  C.displayName = name
  return C
}

/** The same icon, filled (for `Ri*Fill` names and active states). */
export function filled(Source: Icon, name: string): Icon {
  const C = React.forwardRef<SVGSVGElement, IconProps>(
    function Icon(props, ref) {
      return <Source ref={ref} weight="Filled" {...props} />
    },
  )
  C.displayName = name
  return C
}

export const AlignCenter = /*#__PURE__*/ reicon(RTextalignCenter, "AlignCenter")
export const AlignLeft = /*#__PURE__*/ reicon(RTextalignLeft, "AlignLeft")
export const AlignRight = /*#__PURE__*/ reicon(RTextalignRight, "AlignRight")
export const AppWindow = /*#__PURE__*/ reicon(RWindow, "AppWindow")
export const Archive = /*#__PURE__*/ reicon(RArchive, "Archive")
export const ArchiveRestore = /*#__PURE__*/ reicon(
  RArchiveDown,
  "ArchiveRestore",
)
export const ArrowDown = /*#__PURE__*/ reicon(RArrowDown, "ArrowDown")
export const ArrowLeft = /*#__PURE__*/ reicon(RArrowLeft, "ArrowLeft")
export const ArrowLeftRight = /*#__PURE__*/ reicon(
  RArrowSwapHorizontal,
  "ArrowLeftRight",
)
export const ArrowRight = /*#__PURE__*/ reicon(RArrowRight, "ArrowRight")
export const ArrowUp = /*#__PURE__*/ reicon(RArrowUp, "ArrowUp")
export const ArrowUpRight = /*#__PURE__*/ reicon(RArrowUpRight, "ArrowUpRight")
export const ArrowUpToLine = /*#__PURE__*/ reicon(
  RArrowToTopRight,
  "ArrowUpToLine",
)
export const AtSign = /*#__PURE__*/ reicon(RAtSign, "AtSign")
export const BadgeCheck = /*#__PURE__*/ reicon(RVerified, "BadgeCheck")
export const Ban = /*#__PURE__*/ reicon(RForbidden, "Ban")
export const BarChart3 = /*#__PURE__*/ reicon(RChartBar, "BarChart3")
export const Bell = /*#__PURE__*/ reicon(RBell, "Bell")
export const Bold = /*#__PURE__*/ reicon(RTextBold, "Bold")
export const BookOpen = /*#__PURE__*/ reicon(RBookOpen, "BookOpen")
export const Briefcase = /*#__PURE__*/ reicon(RBriefcase, "Briefcase")
export const BriefcaseBusiness = /*#__PURE__*/ reicon(
  RBriefcase,
  "BriefcaseBusiness",
)
export const Building2 = /*#__PURE__*/ reicon(RBuilding2, "Building2")
export const Calculator = /*#__PURE__*/ reicon(RCalculator, "Calculator")
export const CalendarCheck = /*#__PURE__*/ reicon(
  RCalendarCheck,
  "CalendarCheck",
)
export const CalendarClock = /*#__PURE__*/ reicon(
  RCalendarDate,
  "CalendarClock",
)
export const CalendarDays = /*#__PURE__*/ reicon(RCalendarDays, "CalendarDays")
export const CalendarOff = /*#__PURE__*/ reicon(RCalendarRemove, "CalendarOff")
export const CalendarPlus = /*#__PURE__*/ reicon(RCalendarPlus, "CalendarPlus")
export const CalendarRange = /*#__PURE__*/ reicon(RCalendar, "CalendarRange")
export const CalendarSearch = /*#__PURE__*/ reicon(
  RCalendarSearch,
  "CalendarSearch",
)
export const CalendarX = /*#__PURE__*/ reicon(RCalendarX, "CalendarX")
export const Camera = /*#__PURE__*/ reicon(RCamera, "Camera")
export const ChartColumnIncreasing = /*#__PURE__*/ reicon(
  RChartBarTrendUp,
  "ChartColumnIncreasing",
)
export const ChartLine = /*#__PURE__*/ reicon(RChartLine, "ChartLine")
export const Check = /*#__PURE__*/ reicon(RCheck, "Check")
export const CheckCheck = /*#__PURE__*/ reicon(RCheckRead, "CheckCheck")
export const CheckCircle2 = /*#__PURE__*/ reicon(RCheckCircle, "CheckCircle2")
export const ChevronDown = /*#__PURE__*/ reicon(RChevronDown, "ChevronDown")
export const ChevronDownSquare = /*#__PURE__*/ reicon(
  RAngleDownSquare,
  "ChevronDownSquare",
)
export const ChevronLeft = /*#__PURE__*/ reicon(RChevronLeft, "ChevronLeft")
export const ChevronRight = /*#__PURE__*/ reicon(RChevronRight, "ChevronRight")
export const ChevronUp = /*#__PURE__*/ reicon(RChevronUp, "ChevronUp")
/** lucide: no Reicon glyph. */
export const ChevronsDownUp = /*#__PURE__*/ lucide(
  LChevronsDownUp,
  "ChevronsDownUp",
)
export const ChevronsLeft = /*#__PURE__*/ reicon(RAnglesLeft, "ChevronsLeft")
export const ChevronsLeftIcon = /*#__PURE__*/ reicon(
  RAnglesLeft,
  "ChevronsLeftIcon",
)
export const ChevronsRight = /*#__PURE__*/ reicon(RAnglesRight, "ChevronsRight")
export const ChevronsRightIcon = /*#__PURE__*/ reicon(
  RAnglesRight,
  "ChevronsRightIcon",
)
/** lucide: no Reicon glyph. */
export const ChevronsUp = /*#__PURE__*/ lucide(LChevronsUp, "ChevronsUp")
export const ChevronsUpDown = /*#__PURE__*/ reicon(
  RChevronExpandY,
  "ChevronsUpDown",
)
export const Chrome = /*#__PURE__*/ reicon(RChrome, "Chrome")
/** lucide: no Reicon glyph. */
export const Circle = /*#__PURE__*/ lucide(LCircle, "Circle")
export const CircleAlert = /*#__PURE__*/ reicon(RAlertCircle, "CircleAlert")
export const CircleCheck = /*#__PURE__*/ reicon(RCheckCircle, "CircleCheck")
export const CircleCheckIcon = /*#__PURE__*/ reicon(
  RCheckCircle,
  "CircleCheckIcon",
)
/** lucide: no Reicon glyph. */
export const CircleDashed = /*#__PURE__*/ lucide(LCircleDashed, "CircleDashed")
export const CircleDollarSign = /*#__PURE__*/ reicon(
  RDollarCircle,
  "CircleDollarSign",
)
export const CircleDot = /*#__PURE__*/ reicon(RRecordCircle, "CircleDot")
export const CircleHelp = /*#__PURE__*/ reicon(RHelpCircle, "CircleHelp")
export const CircleX = /*#__PURE__*/ reicon(RCloseCircle, "CircleX")
export const ClipboardCheck = /*#__PURE__*/ reicon(
  RClipboardCheck,
  "ClipboardCheck",
)
export const ClipboardCopy = /*#__PURE__*/ reicon(
  RClipboardText,
  "ClipboardCopy",
)
export const ClipboardPaste = /*#__PURE__*/ reicon(
  RClipboardImport,
  "ClipboardPaste",
)
export const Clock = /*#__PURE__*/ reicon(RClock, "Clock")
export const Cloud = /*#__PURE__*/ reicon(RCloud, "Cloud")
export const CloudOff = /*#__PURE__*/ reicon(RCloudCross, "CloudOff")
export const CloudUpload = /*#__PURE__*/ reicon(RCloudUpload, "CloudUpload")
export const Code = /*#__PURE__*/ reicon(RCode, "Code")
export const Code2 = /*#__PURE__*/ reicon(RCode2, "Code2")
export const Coffee = /*#__PURE__*/ reicon(RCoffee, "Coffee")
/** lucide: no Reicon glyph. */
export const Columns2 = /*#__PURE__*/ lucide(LColumns2, "Columns2")
/** lucide: no Reicon glyph. */
export const Columns3 = /*#__PURE__*/ lucide(LColumns3, "Columns3")
export const Copy = /*#__PURE__*/ reicon(RCopy, "Copy")
export const CopyPlus = /*#__PURE__*/ reicon(RDocumentCopy, "CopyPlus")
/** lucide: no Reicon glyph. */
export const CornerDownLeft = /*#__PURE__*/ lucide(
  LCornerDownLeft,
  "CornerDownLeft",
)
/** lucide: no Reicon glyph. */
export const CornerDownRight = /*#__PURE__*/ lucide(
  LCornerDownRight,
  "CornerDownRight",
)
/** lucide: no Reicon glyph. */
export const CornerLeftUp = /*#__PURE__*/ lucide(LCornerLeftUp, "CornerLeftUp")
export const CreditCard = /*#__PURE__*/ reicon(RCreditCard, "CreditCard")
export const Delete = /*#__PURE__*/ reicon(RTrash, "Delete")
export const Download = /*#__PURE__*/ reicon(RDownload, "Download")
export const EllipsisIcon = /*#__PURE__*/ reicon(RMoreH, "EllipsisIcon")
export const Eraser = /*#__PURE__*/ reicon(REraser, "Eraser")
export const ExternalLink = /*#__PURE__*/ reicon(RArrowUpRight, "ExternalLink")
export const Eye = /*#__PURE__*/ reicon(REye, "Eye")
export const EyeOff = /*#__PURE__*/ reicon(REyeOff, "EyeOff")
export const File = /*#__PURE__*/ reicon(RFile, "File")
export const FileIcon = /*#__PURE__*/ reicon(RFile, "FileIcon")
export const FileImage = /*#__PURE__*/ reicon(RGallery, "FileImage")
export const FilePen = /*#__PURE__*/ reicon(REdit2, "FilePen")
export const FilePlus = /*#__PURE__*/ reicon(RFilePlus, "FilePlus")
export const FilePlus2 = /*#__PURE__*/ reicon(RFilePlus, "FilePlus2")
export const FileSignature = /*#__PURE__*/ reicon(
  RDocumentText,
  "FileSignature",
)
export const FileText = /*#__PURE__*/ reicon(RFileText, "FileText")
export const Files = /*#__PURE__*/ reicon(RFiles, "Files")
export const Filter = /*#__PURE__*/ reicon(RFilter, "Filter")
export const Flag = /*#__PURE__*/ reicon(RFlag, "Flag")
export const Flower = /*#__PURE__*/ reicon(RLeaf, "Flower")
export const Folder = /*#__PURE__*/ reicon(RFolder, "Folder")
export const FolderInput = /*#__PURE__*/ reicon(RFolderMove, "FolderInput")
export const FolderKanban = /*#__PURE__*/ reicon(RKanban, "FolderKanban")
export const FolderOpen = /*#__PURE__*/ reicon(RFolderOpen, "FolderOpen")
export const FolderPlus = /*#__PURE__*/ reicon(RFolderPlus, "FolderPlus")
export const GalleryHorizontal = /*#__PURE__*/ reicon(
  RGalleryWide,
  "GalleryHorizontal",
)
export const Gauge = /*#__PURE__*/ reicon(RGauge, "Gauge")
/** lucide: no Reicon glyph. */
export const Github = /*#__PURE__*/ lucide(LGithub, "Github")
export const Globe = /*#__PURE__*/ reicon(RGlobe, "Globe")
/** lucide: no Reicon glyph. */
export const GripHorizontal = /*#__PURE__*/ lucide(
  LGripHorizontal,
  "GripHorizontal",
)
/** lucide: no Reicon glyph. */
export const GripVertical = /*#__PURE__*/ lucide(LGripVertical, "GripVertical")
export const Hammer = /*#__PURE__*/ reicon(RSledgehammer, "Hammer")
export const Hash = /*#__PURE__*/ reicon(RHashtag, "Hash")
/** lucide: no Reicon glyph. */
export const Heading = /*#__PURE__*/ lucide(LHeading, "Heading")
/** lucide: no Reicon glyph. */
export const Heading1 = /*#__PURE__*/ lucide(LHeading1, "Heading1")
/** lucide: no Reicon glyph. */
export const Heading2 = /*#__PURE__*/ lucide(LHeading2, "Heading2")
/** lucide: no Reicon glyph. */
export const Heading3 = /*#__PURE__*/ lucide(LHeading3, "Heading3")
export const Heart = /*#__PURE__*/ reicon(RHeart, "Heart")
export const Home = /*#__PURE__*/ reicon(RHome, "Home")
export const IdCard = /*#__PURE__*/ reicon(RAddressCard, "IdCard")
export const Image = /*#__PURE__*/ reicon(RImage, "Image")
export const ImageIcon = /*#__PURE__*/ reicon(RImage, "ImageIcon")
export const ImagePlus = /*#__PURE__*/ reicon(RImagePlus, "ImagePlus")
export const ImageUp = /*#__PURE__*/ reicon(RImageUp, "ImageUp")
export const Inbox = /*#__PURE__*/ reicon(RInbox, "Inbox")
export const Infinity = /*#__PURE__*/ reicon(RInfinite, "Infinity")
export const Info = /*#__PURE__*/ reicon(RInfoCircle, "Info")
export const InfoIcon = /*#__PURE__*/ reicon(RInfoCircle, "InfoIcon")
export const Italic = /*#__PURE__*/ reicon(RTextItalic, "Italic")
export const Languages = /*#__PURE__*/ reicon(RTranslate, "Languages")
export const Layers = /*#__PURE__*/ reicon(RLayers, "Layers")
export const LayoutDashboard = /*#__PURE__*/ reicon(RElement, "LayoutDashboard")
export const LayoutGrid = /*#__PURE__*/ reicon(RCategory, "LayoutGrid")
export const Link = /*#__PURE__*/ reicon(RLink, "Link")
export const Link2 = /*#__PURE__*/ reicon(RLink2, "Link2")
export const Link2Off = /*#__PURE__*/ reicon(RLinkOff, "Link2Off")
export const List = /*#__PURE__*/ reicon(RList, "List")
export const ListChecks = /*#__PURE__*/ reicon(RChecklist, "ListChecks")
export const ListCollapse = /*#__PURE__*/ reicon(RListArrowUp, "ListCollapse")
export const ListFilter = /*#__PURE__*/ reicon(RFilterSearch, "ListFilter")
export const ListIcon = /*#__PURE__*/ reicon(RList, "ListIcon")
export const ListOrdered = /*#__PURE__*/ reicon(ROrderedList, "ListOrdered")
export const ListPlus = /*#__PURE__*/ reicon(RClipboardAdd, "ListPlus")
export const ListTodo = /*#__PURE__*/ reicon(RCheckListSquare, "ListTodo")
export const Loader = /*#__PURE__*/ reicon(RLoader, "Loader")
export const Loader2Icon = /*#__PURE__*/ reicon(RLoader, "Loader2Icon")
export const LoaderCircle = /*#__PURE__*/ reicon(RLoader, "LoaderCircle")
export const Lock = /*#__PURE__*/ reicon(RLock, "Lock")
export const LogIn = /*#__PURE__*/ reicon(RLogin, "LogIn")
export const LogOut = /*#__PURE__*/ reicon(RLogout, "LogOut")
export const Logout = /*#__PURE__*/ reicon(RLogout, "Logout")
export const Mail = /*#__PURE__*/ reicon(REnvelope, "Mail")
export const MailOpen = /*#__PURE__*/ reicon(REnvelopeOpen, "MailOpen")
export const MapPin = /*#__PURE__*/ reicon(RMapPoint, "MapPin")
export const Maximize = /*#__PURE__*/ reicon(RMaximize, "Maximize")
export const Maximize2 = /*#__PURE__*/ reicon(RFullscreen, "Maximize2")
export const Megaphone = /*#__PURE__*/ reicon(RBullhorn, "Megaphone")
export const Menu = /*#__PURE__*/ reicon(RMenu, "Menu")
export const MessageCircle = /*#__PURE__*/ reicon(
  RMessageCircle,
  "MessageCircle",
)
export const MessageSquareWarning = /*#__PURE__*/ reicon(
  RMessageSquare,
  "MessageSquareWarning",
)
export const Minimize2 = /*#__PURE__*/ reicon(RExitFullscreen, "Minimize2")
export const Minus = /*#__PURE__*/ reicon(RMinus, "Minus")
export const MinusIcon = /*#__PURE__*/ reicon(RMinus, "MinusIcon")
export const Monitor = /*#__PURE__*/ reicon(RMonitor, "Monitor")
export const Moon = /*#__PURE__*/ reicon(RMoon, "Moon")
export const MoreHorizontal = /*#__PURE__*/ reicon(RMoreH, "MoreHorizontal")
export const MoreHorizontalIcon = /*#__PURE__*/ reicon(
  RMoreH,
  "MoreHorizontalIcon",
)
export const MoreVertical = /*#__PURE__*/ reicon(RMore, "MoreVertical")
export const MousePointerClick = /*#__PURE__*/ reicon(
  RCursor,
  "MousePointerClick",
)
export const Newspaper = /*#__PURE__*/ reicon(RDocumentText, "Newspaper")
export const NotebookPen = /*#__PURE__*/ reicon(RNotebook, "NotebookPen")
export const OctagonAlert = /*#__PURE__*/ reicon(RDanger, "OctagonAlert")
export const OctagonXIcon = /*#__PURE__*/ reicon(RForbidden, "OctagonXIcon")
export const Palette = /*#__PURE__*/ reicon(RPalette, "Palette")
export const PanelLeftIcon = /*#__PURE__*/ reicon(RSidebarLeft, "PanelLeftIcon")
export const Paperclip = /*#__PURE__*/ reicon(RPaperclip, "Paperclip")
export const Pause = /*#__PURE__*/ reicon(RPause, "Pause")
export const Pencil = /*#__PURE__*/ reicon(RPen, "Pencil")
export const PencilRuler = /*#__PURE__*/ reicon(RRulerPen, "PencilRuler")
export const Phone = /*#__PURE__*/ reicon(RPhone, "Phone")
export const PieChart = /*#__PURE__*/ reicon(RChartPie, "PieChart")
/** lucide: no Reicon glyph. */
export const Pilcrow = /*#__PURE__*/ lucide(LPilcrow, "Pilcrow")
export const Pin = /*#__PURE__*/ reicon(RPin, "Pin")
export const Play = /*#__PURE__*/ reicon(RPlay, "Play")
export const Plus = /*#__PURE__*/ reicon(RPlus, "Plus")
export const Power = /*#__PURE__*/ reicon(RPower, "Power")
export const Printer = /*#__PURE__*/ reicon(RPrinter, "Printer")
export const Quote = /*#__PURE__*/ reicon(RQuoteUp, "Quote")
export const Radio = /*#__PURE__*/ reicon(RRadio, "Radio")
export const Redo2 = /*#__PURE__*/ reicon(RRedo, "Redo2")
export const RefreshCW = /*#__PURE__*/ reicon(RRefresh, "RefreshCW")
export const Repeat2 = /*#__PURE__*/ reicon(RRepeat, "Repeat2")
export const Rocket = /*#__PURE__*/ reicon(RRocket, "Rocket")
export const RotateCcw = /*#__PURE__*/ reicon(RRotateLeft, "RotateCcw")
export const RotateCw = /*#__PURE__*/ reicon(RRotateRight, "RotateCw")
/** lucide: no Reicon glyph. */
export const Rows2 = /*#__PURE__*/ lucide(LRows2, "Rows2")
export const Ruler = /*#__PURE__*/ reicon(RRuler, "Ruler")
export const Save = /*#__PURE__*/ reicon(RSave, "Save")
export const Scissors = /*#__PURE__*/ reicon(RScissors, "Scissors")
export const ScrollText = /*#__PURE__*/ reicon(RScroll, "ScrollText")
export const Search = /*#__PURE__*/ reicon(RSearch, "Search")
export const SearchCheck = /*#__PURE__*/ reicon(RSearchFavorite, "SearchCheck")
export const Send = /*#__PURE__*/ reicon(RSend, "Send")
/** lucide: no Reicon glyph. */
export const SeparatorHorizontal = /*#__PURE__*/ lucide(
  LSeparatorHorizontal,
  "SeparatorHorizontal",
)
export const Settings = /*#__PURE__*/ reicon(RSettings, "Settings")
export const Settings2 = /*#__PURE__*/ reicon(RSettings2, "Settings2")
export const ShieldCheck = /*#__PURE__*/ reicon(RShieldCheck, "ShieldCheck")
export const SlidersHorizontal = /*#__PURE__*/ reicon(
  RSliders,
  "SlidersHorizontal",
)
export const Smartphone = /*#__PURE__*/ reicon(RMobile, "Smartphone")
export const Smile = /*#__PURE__*/ reicon(RFaceSmile, "Smile")
export const Sparkles = /*#__PURE__*/ reicon(RSparkles, "Sparkles")
/** lucide: no Reicon glyph. */
export const Split = /*#__PURE__*/ lucide(LSplit, "Split")
/** lucide: no Reicon glyph. */
export const Square = /*#__PURE__*/ lucide(LSquare, "Square")
export const SquarePen = /*#__PURE__*/ reicon(RPenSquare, "SquarePen")
export const SquareStop = /*#__PURE__*/ reicon(RStop, "SquareStop")
export const Star = /*#__PURE__*/ reicon(RStar, "Star")
export const StickyNote = /*#__PURE__*/ reicon(RStickynote, "StickyNote")
export const StopCircle = /*#__PURE__*/ reicon(RStopCircle, "StopCircle")
/** lucide: no Reicon glyph. */
export const Strikethrough = /*#__PURE__*/ lucide(
  LStrikethrough,
  "Strikethrough",
)
export const Sun = /*#__PURE__*/ reicon(RSun, "Sun")
export const Sunrise = /*#__PURE__*/ reicon(RSunrise, "Sunrise")
/** lucide: no Reicon glyph. */
export const Table = /*#__PURE__*/ lucide(LTable, "Table")
/** lucide: no Reicon glyph. */
export const Table2 = /*#__PURE__*/ lucide(LTable2, "Table2")
export const Tablet = /*#__PURE__*/ reicon(RTablet, "Tablet")
export const Tag = /*#__PURE__*/ reicon(RTag, "Tag")
export const Target = /*#__PURE__*/ reicon(RTarget, "Target")
export const TextCursorInput = /*#__PURE__*/ reicon(
  RTextInput,
  "TextCursorInput",
)
export const TextQuote = /*#__PURE__*/ reicon(RQuoteDown, "TextQuote")
export const TimerReset = /*#__PURE__*/ reicon(RTimer, "TimerReset")
export const ToggleRight = /*#__PURE__*/ reicon(RToggleOn, "ToggleRight")
export const Trash2 = /*#__PURE__*/ reicon(RTrash2, "Trash2")
export const TriangleAlert = /*#__PURE__*/ reicon(
  RAlertTriangle,
  "TriangleAlert",
)
export const TriangleAlertIcon = /*#__PURE__*/ reicon(
  RAlertTriangle,
  "TriangleAlertIcon",
)
/** lucide: no Reicon glyph. */
export const Twitter = /*#__PURE__*/ lucide(LTwitter, "Twitter")
export const Underline = /*#__PURE__*/ reicon(RTextUnderline, "Underline")
export const Undo2 = /*#__PURE__*/ reicon(RUndo, "Undo2")
export const Upload = /*#__PURE__*/ reicon(RUpload, "Upload")
export const User = /*#__PURE__*/ reicon(RUser, "User")
export const UserCheck = /*#__PURE__*/ reicon(RUserCheck, "UserCheck")
export const UserPlus = /*#__PURE__*/ reicon(RUserAdd, "UserPlus")
export const UserRound = /*#__PURE__*/ reicon(RUserCircle, "UserRound")
export const UserRoundX = /*#__PURE__*/ reicon(RUserX, "UserRoundX")
export const Users = /*#__PURE__*/ reicon(RUsers, "Users")
export const UsersRound = /*#__PURE__*/ reicon(RUsers2, "UsersRound")
export const Video = /*#__PURE__*/ reicon(RVideo, "Video")
export const VolumeX = /*#__PURE__*/ reicon(RVolumeX, "VolumeX")
export const Wallet = /*#__PURE__*/ reicon(RWallet, "Wallet")
export const WandSparkles = /*#__PURE__*/ reicon(RWandSparkle, "WandSparkles")
export const WifiOff = /*#__PURE__*/ reicon(RWifiOff, "WifiOff")
export const Workflow = /*#__PURE__*/ reicon(RHierarchy, "Workflow")
export const X = /*#__PURE__*/ reicon(RX, "X")
export const XCircle = /*#__PURE__*/ reicon(RXCircle, "XCircle")
