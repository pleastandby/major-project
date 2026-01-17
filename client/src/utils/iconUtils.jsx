import {
    Book,
    Code,
    FlaskConical,
    Calculator,
    Globe,
    Music,
    Database,
    Cpu,
    PenTool,
    Layers,
    Atom,
    Briefcase,
    ChartBar,
    Fingerprint,
    Lightbulb
} from 'lucide-react';

export const iconMap = {
    'book': Book,
    'code': Code,
    'flask': FlaskConical,
    'calculator': Calculator,
    'globe': Globe,
    'music': Music,
    'database': Database,
    'cpu': Cpu,
    'design': PenTool,
    'layers': Layers,
    'science': Atom,
    'business': Briefcase,
    'chart': ChartBar,
    'security': Fingerprint,
    'idea': Lightbulb
};

export const getCourseIcon = (iconName) => {
    const IconComponent = iconMap[iconName] || Book; // Default to Book
    return IconComponent;
};

export const getIconNames = () => Object.keys(iconMap);
